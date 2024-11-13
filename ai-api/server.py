import os
import io
import cv2
import json
import uuid
import base64
import requests
import thecolorapi
import numpy as np
from PIL import Image
from flask_cors import CORS
from flask import Flask, request, jsonify, send_file, redirect, url_for, send_from_directory, render_template
from datetime import datetime
import threading
import time
from io import BytesIO

app = Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": [
            r"http://localhost:\d+", 
            "https://decoraition.onrender.com", 
            "https://decoraition.org", 
            "https://www.decoraition.org"
    ]}
})

# Constant variables
SD_URL = "http://127.0.0.1:7860"
SERVER_URL = "http://127.0.0.1:3500"
IMAGES_FOLDER = 'static/images'
if not os.path.exists(IMAGES_FOLDER):
    os.makedirs(IMAGES_FOLDER)
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
app.config['IMAGES_FOLDER'] = IMAGES_FOLDER
sdxl_styles = [
    {
        "name": "base",
        "prompt": "{prompt}",
        "negative_prompt": ""
    },
    {
        "name": "3D Model",
        "prompt": "professional 3d model of {prompt} . octane render, highly detailed, volumetric, dramatic lighting",
        "negative_prompt": "ugly, deformed, noisy, low poly, blurry, painting, person, people, face, hands, legs, feet"
    }
]
task_queue = []
task_history = []

# File-related functions
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def generate_image_filename(extension="png"):
    return f"{uuid.uuid4()}.{extension}"

def load_and_encode_image(image_file, from_url=False):
    """Load an image using PIL and encode it to base64 PNG for ControlNet."""
    try:
        # Check if image is a URL or file
        if from_url:
            response = requests.get(image_file)
            response.raise_for_status()
            image = Image.open(BytesIO(response.content)).convert('RGB')
        else:
            # Load image with PIL
            image = Image.open(image_file).convert('RGB')

        # Convert PIL image to a numpy array
        image_np = np.array(image)

        # Convert from RGB to BGR for OpenCV (since OpenCV uses BGR by default)
        image_np_bgr = cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR)

        # Encode into PNG using OpenCV and then base64
        retval, bytes_img = cv2.imencode('.png', image_np_bgr)
        encoded_image = base64.b64encode(bytes_img).decode('utf-8')
        
        return encoded_image
    except Exception as e:
        print(f"Error loading and encoding image: {e}")
        return None

def decode_base64_image(base64_str):
    """Decode a base64 image string and convert it to a NumPy array."""
    try:
        # Remove the prefix if present
        if base64_str.startswith("data:image/png;base64,"):
            base64_str = base64_str.split(",")[1]

        # Decode the base64 string
        image_data = base64.b64decode(base64_str)

        # Convert to a NumPy array
        image_array = np.frombuffer(image_data, dtype=np.uint8)

        # Decode into an image using OpenCV
        image = cv2.imdecode(image_array, cv2.IMREAD_GRAYSCALE)

        return image
    except Exception as e:
        print(f"Error decoding base64 image: {e}")
        return None

def image_path_to_base64(image_path):
    # Check if image_path is valid and the file is allowed
    if image_path and allowed_file(image_path):
        if not os.path.exists(image_path):
            image_path = os.path.join(app.root_path, image_path.lstrip('/'))
    
    # Check if the file exists
    if os.path.exists(image_path):
        try:
            # Open the image file in binary mode
            with open(image_path, "rb") as image_file:
                # Read the image file and encode it as base64
                encoded_image = base64.b64encode(image_file.read()).decode('utf-8')
            return encoded_image
        except Exception as e:
            print(f"Error reading or encoding the image: {e}")
            return None
    else:
        print("Error: Image path does not exist.")
        return None

def extract_base64_data(data_url):
    if data_url.startswith("data:image/png;base64,"):
        return data_url.split(",", 1)[1]  # Get the base64 part only
    return data_url 

def save_images(image_data_list, folder_name):
    """Helper function to save images and return file paths."""
    saved_paths = []
    for image_data in image_data_list:
        if image_data:
            image_bytes = base64.b64decode(image_data.split(",", 1)[-1])
            img = Image.open(io.BytesIO(image_bytes))
            filename = generate_image_filename("png")
            folder_path = f"static/{folder_name}"
            os.makedirs(folder_path, exist_ok=True)
            image_path = os.path.join(f"static/{folder_name}", filename)
            img.save(image_path)
            saved_paths.append(f"/static/{folder_name}/{filename}")
    return saved_paths

def save_images_agent_scheduler(image_data_list, folder_name):
    """Helper function to save images and return file paths."""
    saved_paths = []
    for image_data in image_data_list:
        if image_data.get("image"):  # Check if "image" key exists
            # Access the base64 image string from the dictionary
            image_str = image_data["image"]
            # Decode the base64 image data
            image_bytes = base64.b64decode(image_str.split(",", 1)[-1])
            img = Image.open(io.BytesIO(image_bytes))
            filename = generate_image_filename("png")
            folder_path = f"static/{folder_name}"
            os.makedirs(folder_path, exist_ok=True)
            image_path = os.path.join(folder_path, filename)
            img.save(image_path)
            saved_paths.append(f"/static/{folder_name}/{filename}")
    return saved_paths

def save_image_from_base64(image_base64, folder_name):
    """Helper function to save a combined mask and return its file path."""
    # Decode the base64 image
    image_bytes = base64.b64decode(image_base64)
    img = Image.open(io.BytesIO(image_bytes))

    # Generate filename and save path
    filename = generate_image_filename("png")
    folder_path = f"static/{folder_name}"
    os.makedirs(folder_path, exist_ok=True)  # Ensure the folder exists
    image_path = os.path.join(folder_path, filename)

    # Save the image to the specified folder
    img.save(image_path)
    print(f"Image saved at: {image_path}")

    return f"/static/{folder_name}/{filename}"

def fix_base64_padding(base64_string):
    """Fix incorrect padding in base64 string."""
    return base64_string + '=' * (4 - len(base64_string) % 4)

def make_black_transparent(image_path):
    """Convert black pixels to transparent in the image at the given path."""
    try:
        # Open the image from the file path
        if image_path and allowed_file(image_path):
            image_path = os.path.join(app.root_path, image_path.lstrip('/'))
        else:
            print(f"image_path does not exist/ extension not allowed.")
            return None

        # Open the image
        img = Image.open(image_path).convert("RGBA")

        # Convert the image to a NumPy array
        image_np = np.array(img)

        # Create a mask where black pixels are found
        black_pixels_mask = (image_np[:, :, 0] < 10) & (image_np[:, :, 1] < 10) & (image_np[:, :, 2] < 10)
        
        # Set those pixels to transparent
        image_np[black_pixels_mask] = (255, 255, 255, 0)  # Fully transparent

        # Convert back to PIL image
        img = Image.fromarray(image_np, 'RGBA')

        # Save the modified image to a bytes buffer
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        buffered.seek(0)

        # Get the base64 encoding of the modified image
        image_base64 = base64.b64encode(buffered.read()).decode('utf-8')
        image_base64 = fix_base64_padding(image_base64)

        # Save the image using the helper function
        output_path = save_image_from_base64(image_base64, "masks")
        return output_path  # Return the path of the saved image

    except Exception as e:
        print(f"Error making black transparent: {e}")
        return None

# Color name functions using thecolorapi
def thecolorapi_hex_to_color_name(hex_code):
    try:
        color = thecolorapi.color(hex=hex_code)
        return color.name
    except Exception as e:
        print(f"Error retrieving color name: {e}")
        return hex_code  # Return the original hex code if there's an error

def build_prompt_with_color(base_prompt, color_palette):
    try:
        color_names = [thecolorapi_hex_to_color_name(hex_code) for hex_code in color_palette]
        colors_description = ", ".join(color_names)
        return f"{base_prompt} with colors {colors_description}"
    except Exception as e:
        print(f"Error building prompt with color: {e}")
        return base_prompt

# SDXL Styles with color function
def apply_sdxl_style(selected_style_name, prompt, color_palette=None):
    """Apply the SDXL style to the user prompt and insert color description right after the {prompt}."""
    selected_style = next((style for style in sdxl_styles if style["name"] == selected_style_name), None)

    if selected_style:
        # Build the color description if the color palette is provided
        if color_palette:
            color_names = [thecolorapi_hex_to_color_name(hex_code) for hex_code in color_palette]
            colors_description = f" with colors {', '.join(color_names)}"
        else:
            colors_description = ""

        # Replace the {prompt} placeholder with the user input and insert the color description
        prompt = selected_style["prompt"].replace("{prompt}", f"{prompt}{colors_description}")
        negative_prompt = selected_style["negative_prompt"]

        return prompt, negative_prompt
    else:
        # In case no style is found, apply color palette to base prompt (if color_palette exists)
        if color_palette:
            color_names = [thecolorapi_hex_to_color_name(hex_code) for hex_code in color_palette]
            colors_description = f" with colors {', '.join(color_names)}"
            prompt = f"{prompt}{colors_description}"
        # Return original prompt with no negative prompt
        return prompt, ""

# SCHEDULER
def execute_task(task, type):
    """Execute the task based on its parameters with retry logic."""
    task_id = task.get("task_id")
    task["status"] = "running"
    
    # Attempt to execute the task twice
    for attempt in range(2):  # Retry once (0 and 1)
        try:
            print(f"Executing task {task_id}.")
            response = requests.post(f"{SD_URL}/sdapi/v1/{type}", json=task.get("parameters"))
            print(f"Response: {response.status_code}")
            if response.status_code == 200 and isinstance(response.json(), dict) and response.json().get("images"):
                # On success
                images_data = response.json().get("images", [])
                print(f"Received {len(images_data)} images")
                image_paths = save_images(images_data, "images")
                task["status"] = "success"
                task["result"] = image_paths
                task["finished_at"] = datetime.utcnow().isoformat()
                task_history.append(task)
                task_queue.remove(task)
                for remaining_task in task_queue:
                    remaining_task["position"] -= 1
                return
            else:
                # If the first attempt fails
                if attempt == 0:
                    print(f"Attempt {attempt + 1} failed for task {task_id}. Retrying...")
                else:
                    # On failure (after second attempt)
                    print(f"Task {task_id} failed after two attempts.")
                    task["status"] = "failed"
                    task_history.append(task)
                    task_queue.remove(task)
                    for remaining_task in task_queue:
                        remaining_task["position"] -= 1
                    return
        except Exception as e:
            print(f"Error executing task {task_id} on attempt {attempt + 1}: {e}")
            if attempt == 1:  # Second attempt failed
                task["status"] = "failed"
                task_history.append(task)
                task_queue.remove(task)
                for remaining_task in task_queue:
                    remaining_task["position"] -= 1

def task_manager():
    """Manage the task queue and execute tasks based on position changes."""
    while True:
        if task_queue:
            # Only check the task at position 0 with a status of 'pending'
            for task in task_queue:
                if task.get("position") == 1 and task.get("status") == "pending":
                    threading.Thread(target=execute_task, args=(task,task.get("type"))).start()
                    break  # Only execute one task at a time
        time.sleep(0.5)  # Shorter sleep to check more frequently

# Start the task manager in a background thread
threading.Thread(target=task_manager, daemon=True).start()

# QUEUEING, STATUS & PROGRESS TRACKING
def queue_task(payload, type):
    try:
        task_id = str(uuid.uuid4())
        queued_at = datetime.utcnow().isoformat()
        task = {
            "task_id": task_id,
            "status": "pending",
            "position": len(task_queue) + 1,
            "type": type,
            "parameters": payload,
            "queued_at": queued_at,
            "finished_at": None,
            "result": None
        }
        task_queue.append(task)
        return task
    except Exception as e:
        print(f"Error queueing task: {e}")
        return None

def get_task_queue_status(task_id):
    """Check the status of a specific task."""
    try:
        # Check task queue first
        for task in task_queue:
            if task.get("task_id") == task_id:
                return task

        # Check task history if not found in queue
        for task in task_history:
            if task.get("task_id") == task_id:
                return task

        # Return None if not found in both
        return None
    except Exception as e:
        print(f"Error fetching task status for {task_id}: {e}")
        return None

@app.route('/generate-image/task-status', methods=['GET'])
def get_task_status_route():
    """Route to get the current progress of tasks in agent scheduler."""
    try:
        task_id = request.args.get('task_id')
        
        # Check the status of the task by ID
        task = get_task_queue_status(task_id)
        if task:
            return jsonify(task), 200
        return jsonify({"error": "Task not found"}), 404
    except Exception as e:
        print(f"Error getting status: {e}")
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

@app.route('/generate-image/image-status', methods=['GET'])
def track_image_generation_progress():
    """Route to get progress of task's image generation."""
    try:
        # Get task ID from the request
        task_id = request.args.get('task_id')
        task = get_task_queue_status(task_id)
        if task:
            status = task.get("status")
        else:
            print(f"Task {task_id} not found in queue or history.")
            return jsonify({"error": "Task not found"}), 404

        # Request progress API using GET
        response = requests.get(f"{SD_URL}/sdapi/v1/progress?skip_current_image=false")

        if response.status_code == 200:
            progress_data = response.json()
            progress_data['status'] = status # Add task status to the progress data
            return jsonify(progress_data), 200
        else:
            print(f"Error fetching progress: {response.status_code}, {response.text}")
            return jsonify({"error": "Failed to retrieve progress"}), response.status_code

    except Exception as e:
        print(f"Error tracking progress: {e}")
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

# GET TASK RESULTS
def get_task_results(task_id):
    """Retrieve the results of a completed task from the scheduler"""
    try:
        for task in task_history + task_queue:
            if task.get("task_id") == task_id:
                if task.get("status") == "success" and task.get("result"):
                    image_paths = task.get("result", [])
                    return jsonify({"message": "Images retrieved.", "image_paths": image_paths}), 200
                elif task.get("status") == "failed":
                    return jsonify({"error": "No images were generated."}), 500
                else:
                    return jsonify({"message": f"Task is {task.get('status')} at {task.get('position')}.", "task": task}), 202
        return jsonify({"error": "Task not found."}), 404
    except Exception as e:
        print(f"Error fetching task results: {e}")
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

@app.route('/generate-image/get-results', methods=['GET'])
def get_task_results_route():
    """Route to get the generated images once the task is completed"""
    try:
        task_id = request.args.get('task_id')
        if not task_id:
            return jsonify({"error": "Task ID is required"}), 400
        return get_task_results(task_id)
    except Exception as e:
        print(f"Error getting task results: {e}")
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

# FIRST IMAGE GENERATION
def validate_first_generation_request(data):
    """Validate the first image generation request."""
    try:
        base_image_encoded = None
        style_reference_encoded = None
        
        if request.content_type.startswith('multipart/form-data'):
            print("Multipart form data detected.")
            # Prompt and number of images
            prompt = data.get('prompt', "").strip()
            number_of_images = int(data.get('number_of_images', 0))
            # Color palette
            color_palette_str = data.get('color_palette', '[]')
            color_palette = json.loads(color_palette_str) if color_palette_str else []
            # Base image
            base_image = request.files.get('base_image')
            if base_image and allowed_file(base_image.filename):
                print(f"Base image received.")
                base_image_encoded = load_and_encode_image(base_image)
                print(f"Base image successfully loaded.")
            else:
                print(f"No base image received.")
                base_image_encoded = None
            # Style reference
            style_reference = request.files.get('style_reference')
            if style_reference and allowed_file(style_reference.filename):
                print(f"Style reference received.")
                style_reference_encoded = load_and_encode_image(style_reference)
                print(f"Style image successfully loaded.")
            else:
                print(f"No style reference received.")
                style_reference_encoded = None
        else:
            prompt = data.get('prompt', "").strip()
            number_of_images = data.get("number_of_images", 0)
            color_palette = data.get('color_palette', [])
            base_image_encoded = None
            style_reference_encoded = None
        
        # Print received data for debugging
        print("========Received Data========")
        print(f"Prompt: {prompt}")
        print(f"Number of Images: {number_of_images}")
        print(f"Color Palette: {color_palette}")
        
        if not prompt:
            print("Empty prompt")
            return None, None, None, None, "Prompt is required"
        
        prompt, negative_prompt = apply_sdxl_style("3D Model", prompt, color_palette)
        print("========Final Prompt========")
        print(f"Prompt: {prompt}")
        print(f"Negative Prompt: {negative_prompt}")

        return prompt, negative_prompt, number_of_images, base_image_encoded, style_reference_encoded
    except Exception as e:
        print(f"Validation error: {e}")
        return None, None, None, None, f"Validation error: {str(e)}"

def generate_first_image(prompt, negative_prompt, number_of_images, base_image, style_reference):
    """First generation core logic"""
    try:
        payload = {
            "prompt": prompt,
            "negative_prompt": negative_prompt,
            "sampler_name": "DPM++ 2M SDE",
            "steps": 30,
            "cfg_scale": 6,
            "width": 512,
            "height": 512,
            "n_iter": number_of_images,
            "seed": -1,
            "denoising_strength": 0.3,
        }

        # Determine case for payload based on input
        if base_image and not style_reference:
            print("========First Gen: prompt with base image (Canny)========")
            payload["alwayson_scripts"] = {
                "controlnet": {
                    "args": [{
                        "enabled": True,
                        "image": base_image,
                        "model": "diffusion_sd_controlnet_canny [a3cd7cd6]",
                        "module": "canny",
                        "weight": 1,
                        "resize_mode": "Scale to Fit (Inner Fit)",
                        "guidance_start": 0,
                        "guidance_end": 1,
                        "control_mode": "ControlNet is more important",
                        "pixel_perfect": True
                    }]
                }
            }
        elif style_reference and not base_image:
            print("========First Gen: prompt with style reference (T2I-Adapter Color)========")
            payload["alwayson_scripts"] = {
                "controlnet": {
                    "args": [{
                        "enabled": True,
                        "image": style_reference,
                        "model": "t2iadapter_color_sd14v1 [8522029d]",
                        "module": "t2ia_color_grid",
                        "weight": 1.2,
                        "resize_mode": "Scale to Fit (Inner Fit)",
                        "guidance_start": 0,
                        "guidance_end": 1,
                        "control_mode": "ControlNet is more important",
                        "pixel_perfect": True
                    }]
                }
            }
        elif base_image and style_reference:
            print("========First Gen: prompt with base image and style reference (Canny + T2I-Adapter Color)========")
            payload["alwayson_scripts"] = {
                "controlnet": {
                    "args": [
                        {
                            "enabled": True,
                            "image": base_image,
                            "model": "diffusion_sd_controlnet_canny [a3cd7cd6]",
                            "module": "canny",
                            "weight": 1,
                            "resize_mode": "Scale to Fit (Inner Fit)",
                            "guidance_start": 0,
                            "guidance_end": 1,
                            "control_mode": "ControlNet is more important",
                            "pixel_perfect": True
                        },
                        {
                            "enabled": True,
                            "image": style_reference,
                            "model": "t2iadapter_color_sd14v1 [8522029d]",
                            "module": "t2ia_color_grid",
                            "weight": 1.2,
                            "resize_mode": "Scale to Fit (Inner Fit)",
                            "guidance_start": 0,
                            "guidance_end": 1,
                            "control_mode": "ControlNet is more important",
                            "pixel_perfect": True
                        }
                    ]
                }
            }
        else:
            print("========First Gen: prompt only-=======")

        # OLD
        # response = requests.post(f"{SD_URL}/sdapi/v1/txt2img", json=payload)
        # response = requests.post(f"{SD_URL}/agent-scheduler/v1/queue/txt2img", json=payload)
        # return response

        # Queue the task for image generation
        task = queue_task(payload, "txt2img")
        if task:
            return jsonify(task=task), 200
        else:
            return jsonify({"error": "Failed to queue task"}), 500

    except Exception as e:
        print(f"Error generating image: {e}")
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500
    
@app.route('/generate-first-image', methods=['POST'])
def generate_first_image_route():
    """Route to generate first image"""
    try:
        # Validate request data
        data = request.form if request.content_type.startswith('multipart/form-data') else request.json
        prompt, negative_prompt, number_of_images, base_image_encoded, style_reference_encoded = validate_first_generation_request(data)
        
        if not prompt:
            return jsonify({"error": "Prompt is required"}), 400

        # Call the image generation function
        response, status_code = generate_first_image(prompt, negative_prompt, number_of_images, base_image_encoded, style_reference_encoded)

        # Handle response (SDAPI sync)
        # if response.status_code == 200 and isinstance(response.json(), dict) and response.json().get("images"):
        #     images_data = response.json().get("images", [])
        #     image_paths = save_images(images_data, "images")
        #     return jsonify({"image_paths": image_paths}), 200
        # else:
        #     return jsonify({"error": "No images were generated. " + response.text}), 500

        # Handle response (Angent Scheduler async)
        # if response.status_code == 200 and isinstance(response.json(), dict) and response.json().get("task_id"):
        #     task_id = response.json().get("task_id")
        #     print(f"Task ID: {task_id}")
        #     return jsonify({"task_id": task_id}), 200
        # else:
        #     return jsonify({"error": "Failed to queue task"}), 500

        # Handle response (own quque system)
        if status_code == 200:
            task_data = response.get_json()
            print(f"Task queued successfully: {task_data}")
            return task_data, 200
        else:
            print("Failed to queue task.")
            return jsonify({"error": "Failed to queue task"}), 500

    except Exception as e:
        # print(f"Error generating image: {e}")
        print(f"Error queuing image generation task: {e}")
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

# GENERATE SAM MASK
def generate_sam_mask(init_image, mask_prompt):
    """Generate SAM mask based on an image and text prompt."""
    if not mask_prompt:
        return None, 400

    print("========Next Gen: generating mask========")
    for attempt in range(2):  # Try to generate the mask twice
        try:
            # Prepare SAM request payload
            payload = {
                "sam_model_name": "sam_vit_b_01ec64.pth",
                "input_image": init_image,
                "sam_positive_points": [],
                "sam_negative_points": [],
                "dino_enabled": True,
                "dino_model_name": "GroundingDINO_SwinT_OGC (694MB)",
                "dino_text_prompt": mask_prompt,
                "dino_box_threshold": 0.3,
                "dino_preview_checkbox": False,
            }

            # Call SAM API to generate the mask
            response = requests.post(f"{SD_URL}/sam/sam-predict", json=payload)
            if response.status_code != 200:
                if attempt == 0:  # If the first attempt fails
                    print(f"Attempt {attempt + 1} failed with status code: {response.status_code}. Retrying...")
                    continue  # Retry on the second attempt
                else:  # If the second attempt fails
                    print("Failed to generate SAM mask after two attempts.")
                    return None, response.status_code

            reply_json = response.json()
            print(reply_json.get("msg", "No message"))

            masks = reply_json.get("masks")
            if not masks:
                print("No masks returned from SAM.")
                return None, 400

            try:
                # Dilate the masks and collect responses
                dilate_payloads = [
                    {"input_image": init_image, "mask": masks[i], "dilate_amount": 10}
                    for i in range(min(3, len(masks)))  # Ensure we process up to 3 masks
                ]

                replies_dilate = []
                for payload in dilate_payloads:
                    dilate_response = requests.post(f"{SD_URL}/sam/dilate-mask", json=payload)
                    replies_dilate.append(dilate_response.json())

                # Extract blended images, masks, and masked images
                reply_dilate = {
                    "blended_images": [reply["blended_image"] for reply in replies_dilate],
                    "masks": [reply["mask"] for reply in replies_dilate],
                    "masked_images": [reply["masked_image"] for reply in replies_dilate],
                }
                return reply_dilate

            except Exception as e:
                print(f"Error expanding SAM mask: {e}")
                print("Returning original SAM mask instead.")
                return reply_json

        except Exception as e:
            print(f"Error generating SAM mask: {e}")
            if attempt == 0:  # If it's the first attempt that failed
                print("Retrying to generate SAM mask...")
                continue  # Retry
            return {"error": f"An error occurred: {str(e)}"}, 500

@app.route('/generate-sam-mask', methods=['POST'])
def generate_sam_mask_route():
    """Route to generate SAM mask."""
    try:
        # Validate request data
        data = request.form if request.content_type.startswith('multipart/form-data') else request.json
        mask_prompt = data.get('mask_prompt', "").strip()
        init_image = request.files.get('init_image') or request.form.get('init_image')
        init_image_encoded = None
        
        if not mask_prompt:
            return jsonify({"error": "Mask prompt is required"}), 400
        if init_image:
            if isinstance(init_image, str):  # If it's a URL string
                print(f"Init image received.")
                init_image_encoded = load_and_encode_image(init_image, from_url=True)
                print(f"Init image successfully loaded.")
            elif allowed_file(init_image.filename):  # If it's an uploaded file
                print(f"Init image received.")
                init_image_encoded = load_and_encode_image(init_image)
                print(f"Init image successfully loaded.")
            elif not allowed_file(init_image.filename):
                return jsonify({"error": "Invalid base image"}), 400
        else:
            return jsonify({"error": "Invalid base image"}), 400

        # Call generate SAM mask function
        response = generate_sam_mask(init_image_encoded, mask_prompt)

        # Handle response
        if isinstance(response, dict) and all(key in response for key in ["blended_images", "masks", "masked_images"]):
            # Save images and return paths
            image_paths = {
                "blended_images": save_images(response.get("blended_images"), "masks"),
                "masks": save_images(response.get("masks"), "masks"),
                "masked_images": save_images(response.get("masked_images"), "masks"),
            }
            return jsonify({"image_paths": image_paths}), 200
        else:
            return jsonify({"error": "Failed to generate SAM mask. Incomplete response."}), 500

    except Exception as e:
        print(f"Error generating SAM mask: {e}")
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

# PREVIEW MASK
def validate_preview_mask(data):
    """Validate preview mask post formdata"""
    try:
        sam_mask_encoded = None
        sam_mask_img_path_whole = None
        user_mask_add_encoded = None
        user_mask_remove_encoded = None
        
        if request.content_type.startswith('multipart/form-data'):
            print("Multipart form data detected.")
            # Refine option
            refine_option = int(data.get('refine_option', 0))
            # SAM mask (old)
            # sam_mask_str = data.get('sam_mask', '{}')
            # sam_mask = json.loads(sam_mask_str) if sam_mask_str else {}
            # if sam_mask and 'mask' in sam_mask and allowed_file(sam_mask['mask']):
            #     print(f"SAM mask received: {sam_mask['mask']}")
            #     sam_mask_img_path = sam_mask['mask']
            # SAM mask (new)
            sam_mask_path = data.get('sam_mask', '')
            if sam_mask_path and allowed_file(sam_mask_path):
                print(f"SAM mask received: {sam_mask_path}")
                sam_mask_img_path = sam_mask_path
                sam_mask_img_path_whole = os.path.join(app.root_path, sam_mask_img_path.lstrip('/'))
                if not os.path.exists(sam_mask_img_path_whole):
                    return None, None, None, None, f"File not found: {sam_mask_img_path_whole}", 400
                with open(sam_mask_img_path_whole, 'rb') as mask_img_file:
                    sam_mask_encoded = load_and_encode_image(mask_img_file)
                print(f"SAM mask successfully loaded and encoded.")
            else:
                print(f"No valid SAM mask received or file extension not allowed.")
                sam_mask_encoded = None            
            # User mask (Add)
            user_mask_add = data.get('user_mask_add', '')
            if user_mask_add:
                print(f"User mask (add) received.")
                user_mask_add_encoded = extract_base64_data(user_mask_add)
                if user_mask_add_encoded is not None:
                    print(f"User mask (add) successfully loaded and encoded.")
                else:
                    print(f"User mask (add) format is invalid.")
                    user_mask_add_encoded = None
            else:
                print(f"No user_mask_add received.")
                user_mask_add_encoded = None
            # User mask (Remove)
            user_mask_remove = data.get('user_mask_remove', '')
            if user_mask_remove:
                print(f"User mask (remove) received.")
                user_mask_remove_encoded = extract_base64_data(user_mask_remove)
                if user_mask_remove_encoded is not None:
                    print(f"User mask (remove) successfully loaded and encoded.")
                else:
                    print(f"User mask (remove) format is invalid.")
                    user_mask_remove_encoded = None
            else:
                print(f"No user_mask_remove received.")
                user_mask_remove_encoded = None
        else:
            refine_option = data.get("refine_option", None)
            sam_mask_encoded= None
            sam_mask_img_path_whole = None
            user_mask_add_encoded = None
            user_mask_remove_encoded = None
        
        # Print received data for debugging
        print("========Received Data========")
        print(f"refine_option: {refine_option}")

        if refine_option is None or sam_mask_img_path_whole is None or user_mask_add_encoded is None or user_mask_remove_encoded is None:
            print("Failed getting required masks.")
            return None, None, None, None, "Failed getting required masks. Please try again.", 400

        return refine_option, sam_mask_img_path_whole, user_mask_add_encoded, user_mask_remove_encoded, None, None
    except Exception as e:
        print(f"Validation error: {e}")
        return None, None, None, None, f"Validation error: {str(e)}", 400

def combine_masks(sam_mask_input, user_mask_base64):
    # Check if sam_mask_input is a base64 string or file path
    if sam_mask_input and allowed_file(sam_mask_input):
        sam_mask_input = os.path.join(app.root_path, sam_mask_input.lstrip('/'))
    
    if os.path.exists(sam_mask_input):
        # Load SAM mask from file path
        sam_mask = cv2.imread(sam_mask_input, cv2.IMREAD_GRAYSCALE)
    else:
        # Decode SAM mask from base64
        print("path doesn't exist")
        sam_mask = decode_base64_image(sam_mask_input)
    
    if sam_mask is None:
        print("Error: SAM mask could not be loaded or decoded.")
        return None

    # Convert SAM mask to binary (black and white only)
    _, sam_mask = cv2.threshold(sam_mask, 127, 255, cv2.THRESH_BINARY)

    # Check if user_mask_base64 is provided
    if not user_mask_base64:
        print("No user mask provided; returning SAM mask only.")
        return sam_mask_input, None, None

    # Decode user mask from base64
    user_mask = decode_base64_image(user_mask_base64)
    
    # Check if user_mask is valid
    if user_mask is None or np.count_nonzero(user_mask) == 0:
        print("User mask is all black or invalid; returning SAM mask.")
        return sam_mask_input, None, None

    # Resize user mask to match SAM mask dimensions
    user_mask = cv2.resize(user_mask, (sam_mask.shape[1], sam_mask.shape[0]))

    # Convert user mask to binary (black and white only)
    _, user_mask = cv2.threshold(user_mask, 127, 255, cv2.THRESH_BINARY)

    # Combine the masks
    combined_mask = cv2.addWeighted(sam_mask, 1, user_mask, 1, 0)

    # Threshold the combined mask to ensure it’s binary (0 and 255)
    _, combined_mask = cv2.threshold(combined_mask, 1, 255, cv2.THRESH_BINARY)

    if combined_mask is None:
        print("Failed to create the combined mask.")
        return None, "Failed to create the combined mask.", 500

    # Save combined mask to a temporary buffer
    _, combined_mask_buffer = cv2.imencode('.png', combined_mask)
    combined_mask_base64 = base64.b64encode(combined_mask_buffer).decode('utf-8')

    # Save and return the combined mask path
    combined_mask_path = save_image_from_base64(combined_mask_base64, "masks")
    print(f"Combined Mask Path: {combined_mask_path}")

    return combined_mask_path, None, None

def subtract_masks(sam_mask_input, user_mask_base64):
    # Check if sam_mask_input is a base64 string or file path
    if sam_mask_input and allowed_file(sam_mask_input):
        sam_mask_input = os.path.join(app.root_path, sam_mask_input.lstrip('/'))
    if os.path.exists(sam_mask_input):
        # Load SAM mask from file path
        sam_mask = cv2.imread(sam_mask_input, cv2.IMREAD_GRAYSCALE)
    else:
        # Decode SAM mask from base64
        print("path doesn't exist")
        sam_mask = decode_base64_image(sam_mask_input)
    
    if sam_mask is None:
        print("Error: SAM mask could not be loaded or decoded.")
        return None

    # Convert SAM mask to binary (black and white only)
    _, sam_mask = cv2.threshold(sam_mask, 127, 255, cv2.THRESH_BINARY)

    # Check if user_mask_base64 is provided
    if not user_mask_base64:
        print("No user mask provided; returning SAM mask only.")
        return sam_mask_input, None, None

    # Decode user mask from base64
    user_mask = decode_base64_image(user_mask_base64)
    
    # Check if user_mask is valid
    if user_mask is None or np.count_nonzero(user_mask) == 0:
        print("User mask is all black or invalid; returning SAM mask.")
        return sam_mask_input, None, None

    # Resize user mask to match SAM mask dimensions
    user_mask = cv2.resize(user_mask, (sam_mask.shape[1], sam_mask.shape[0]))

    # Convert user mask to binary (black and white only)
    _, user_mask = cv2.threshold(user_mask, 127, 255, cv2.THRESH_BINARY)

    # Subtract user mask from SAM mask (white parts removed from SAM mask)
    subtracted_mask = cv2.subtract(sam_mask, user_mask)

    if subtracted_mask is None:
        print("Failed to create the subtracted mask.")
        return None, "Failed to create the subtracted mask.", 500

    # Threshold the subtracted mask to ensure it’s binary (0 and 255)
    _, subtracted_mask = cv2.threshold(subtracted_mask, 1, 255, cv2.THRESH_BINARY)

    # Save subtracted mask to a temporary buffer
    _, subtracted_mask_buffer = cv2.imencode('.png', subtracted_mask)
    subtracted_mask_base64 = base64.b64encode(subtracted_mask_buffer).decode('utf-8')

    # Save and return the subtracted mask path
    subtracted_mask_path = save_image_from_base64(subtracted_mask_base64, "masks")
    print(f"Subtracted Mask Path: {subtracted_mask_path}")

    return subtracted_mask_path, None, None

def preview_mask(refine_option, sam_mask, user_mask_add, user_mask_remove):
    """Combining preview mask logic."""
    try:
        if refine_option == 0:  # Add then remove
            combined_1, error_message, error_status = combine_masks(sam_mask, user_mask_add)
            combined_2, error_message, error_status = subtract_masks(combined_1, user_mask_remove)
            if combined_2 is None:
                print("Error: combined_2 is None.")
                return {"error_message": error_message, "error_status": error_status}

            # Convert combined_2 to have transparency for black parts
            combined_2_png = make_black_transparent(combined_2)
            if combined_2_png:
                print(f"Modified image saved at: {combined_2_png}")

            return { "mask": combined_2, "masked_image": combined_2_png }
        
        elif refine_option == 1:  # Remove then add
            combined_1, error_message, error_status = subtract_masks(sam_mask, user_mask_remove)
            combined_2, error_message, error_status = combine_masks(combined_1, user_mask_add)
            if combined_2 is None:
                print("Error: combined_2 is None.")
                return {"error_message": error_message, "error_status": error_status}
            
            # Convert combined_2 to have transparency for black parts
            combined_2_png = make_black_transparent(combined_2)

            return { "mask": combined_2, "masked_image": combined_2_png }
        
        return {"error_message": "Error combining masks for preview", "error_status": 500}
    
    except Exception as e:
        print(f"Error combining masks for preview: {e}")
        return {"error_message": error_message, "error_status": error_status}

@app.route('/preview-mask', methods=['POST'])
def preview_mask_route():
    """Route to preview mask, must have generated SAM mask, user added and removed mask"""
    try:
        # Validate request data
        data = request.form if request.content_type.startswith('multipart/form-data') else request.json
        refine_option, sam_mask_path, user_mask_add_encoded, user_mask_remove_encoded, error_message, error_status = validate_preview_mask(data)
        
        if error_message:
            return jsonify({"error": error_message}), error_status

        # Payload for API & Make request to API
        response = preview_mask(refine_option, sam_mask_path, user_mask_add_encoded, user_mask_remove_encoded)

        # Handle response
        if response and "masked_image" in response:
            # print(f"Final Masks: {response}")
            return response, 200
        elif response and "error_message" in response:
            print(f"Message: {response}")
            return response, 500
        else:
            return jsonify({"error": "Can't preview masks."}), 500

    except Exception as e:
        print(f"Error previewing masks: {e}")
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

# NEXT IMAGE GENERATION
def validate_next_generation_request(data):
    """Validate the next image generation request"""
    try:
        init_image_encoded = None
        style_reference_encoded = None
        combined_mask_encoded = None
        
        if request.content_type.startswith('multipart/form-data'):
            print("Multipart form data detected.")
            # Prompt and number of images
            prompt = data.get('prompt', "").strip()
            number_of_images = int(data.get('number_of_images', 0))
            # Color palette
            color_palette_str = data.get('color_palette', '[]')
            color_palette = json.loads(color_palette_str) if color_palette_str else []
            # Init image
            init_image = request.files.get('init_image') or request.form.get('init_image')
            if init_image:
                if isinstance(init_image, str):  # If it's a URL string
                    print(f"Init image received.")
                    init_image_encoded = load_and_encode_image(init_image, from_url=True)
                    print(f"Init image successfully loaded.")
                elif allowed_file(init_image.filename):  # If it's an uploaded file
                    print(f"Init image received.")
                    init_image_encoded = load_and_encode_image(init_image)
                    print(f"Init image successfully loaded.")
            else:
                print(f"No init image received.")
                init_image_encoded = None
            # Style reference
            style_reference = request.files.get('style_reference')
            if style_reference and allowed_file(style_reference.filename):
                print(f"Style reference received.")
                style_reference_encoded = load_and_encode_image(style_reference)
                print(f"Style image successfully loaded.")
            else:
                print(f"No style reference received.")
                style_reference_encoded = None
            # Combined mask
            combined_mask = data.get('combined_mask', '')
            if combined_mask and allowed_file(combined_mask):
                print(f"Combined mask received.")
                combined_mask_encoded = image_path_to_base64(combined_mask)
                if combined_mask_encoded is not None:
                    print(f"Combined mask successfully loaded and encoded.")
                else:
                    print(f"Combined mask format is invalid.")
                    combined_mask_encoded = None
            else:
                print(f"No combined_mask received.")
                combined_mask_encoded = None
        else:
            prompt = data.get('prompt', "").strip()
            negative_prompt = ""
            number_of_images = data.get("number_of_images", 0)
            color_palette = data.get('color_palette', [])
            init_image_encoded = None
            combined_mask_encoded = None
            style_reference_encoded = None
        
        # Print received data for debugging
        print("========Received Data========")
        print(f"Prompt: {prompt}")
        print(f"Number of Images: {number_of_images}")
        print(f"Color Palette: {color_palette}")

        if not prompt:
            print("Empty prompt")
            return None, None, None, None, None, None, "Prompt is required", 400
        
        prompt, negative_prompt = apply_sdxl_style("3D Model", prompt, color_palette)
        print("========Final Prompt========")
        print(f"Prompt: {prompt}")
        print(f"Negative Prompt: {negative_prompt}")

        return prompt, negative_prompt, number_of_images, init_image_encoded, combined_mask_encoded, style_reference_encoded, None, None
    except Exception as e:
        print(f"Validation error: {e}")
        return None, None, None, None, None, None, f"Validation error: {str(e)}", 400

def generate_next_image(prompt, negative_prompt, number_of_images, init_image, combined_mask, style_reference):
    """Next generation core logic"""
    try:
        # Set base payload
        payload = {
            "prompt": prompt,
            "negative_prompt": negative_prompt,
            "sampler_name": "DPM++ 2M SDE",
            "steps": 40,
            "cfg_scale": 7,
            "width": 512,
            "height": 512,
            "n_iter": number_of_images,
            "seed": -1,
            "init_images": [init_image],  # Original image for refinement
            "mask": combined_mask,        # Combined mask generated by SAM & user mask
            "denoising_strength": 0.75,   # Controls the impact of the original image
            "resize_mode": 0,             # Crop and resize
            "mask_blur_x": 4,
            "mask_blur_y": 4,
            "inpainting_fill": 0,         # Masked Content = original
            "inpaint_full_res": False,    # Inpaint area = only masked
            "inpaint_full_res_padding": 32,
            "mask_round": True,           # Soft inpainting
            "include_init_images": True
        }

        # Add ControlNet parameters if style reference is provided
        if style_reference:
            print("========Next Gen: prompt with style reference (Canny)========")
            payload["alwayson_scripts"] = {
                "controlnet": {
                    "args": [{
                        "enabled": True,
                        "image": style_reference,
                        "model": "diffusion_sd_controlnet_canny [a3cd7cd6]",
                        "module": "canny",
                        "weight": 1,
                        "resize_mode": "Scale to Fit (Inner Fit)",
                        "guidance_start": 0,
                        "guidance_end": 1,
                        "control_mode": "ControlNet is more important",
                        "pixel_perfect": True
                    }]
                }
            }

        # OLD
        # response = requests.post(f"{SD_URL}/sdapi/v1/img2img", json=payload)
        # response = requests.post(f"{SD_URL}/agent-scheduler/v1/queue/img2img", json=payload)
        # return response

        # Queue the task for image generation
        task = queue_task(payload, "img2img")
        if task:
            return jsonify(task=task), 200
        else:
            return jsonify({"error": "Failed to queue task"}), 500

    except Exception as e:
        print(f"Error generating image: {e}")
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

@app.route('/generate-next-image', methods=['POST'])
def generate_next_image_route():
    """Route to generate next image, must have generated SAM mask beforehand"""
    try:
        # Validate request data
        data = request.form if request.content_type.startswith('multipart/form-data') else request.json
        prompt, negative_prompt, number_of_images, init_image, combined_mask, style_reference, error_message, error_status = validate_next_generation_request(data)
        
        if error_message:
            return jsonify({"error": error_message}), error_status

        # Payload for API & Make request to API
        response, status_code = generate_next_image(prompt, negative_prompt, number_of_images, init_image, combined_mask, style_reference)

        # Handle response (SDAPI sync)
        # if response.status_code == 200 and isinstance(response.json(), dict) and response.json().get("images"):
        #     images_data = response.json().get("images", [])
        #     image_paths = save_images(images_data, "images")
        #     return jsonify({"image_paths": image_paths}), 200
        # else:
        #     return jsonify({"error": "No images were generated. " + response.text}), 500

        # Handle response (Angent Scheduler async)
        # if response.status_code == 200 and isinstance(response.json(), dict) and response.json().get("task_id"):
        #     task_id = response.json().get("task_id")
        #     print(f"Task ID: {task_id}")
        #     return jsonify({"task_id": task_id}), 200
        # else:
        #     return jsonify({"error": "Failed to queue task"}), 500

        # Handle response (own quque system)
        if status_code == 200:
            task_data = response.get_json()
            print(f"Task queued successfully: {task_data}")
            return task_data, 200
        else:
            print("Failed to queue task.")
            return jsonify({"error": "Failed to queue task"}), 500

    except Exception as e:
        # print(f"Error generating image: {e}")
        print(f"Error queuing image generation task: {e}")
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

# OTHER APP ROUTES
@app.route('/images/<filename>')
def serve_image(filename):
    """Serve the generated image files."""
    return send_file(os.path.join(IMAGES_FOLDER, filename), mimetype='image/png')

@app.route('/')
def index():
    """Redirect to the first generation test page."""
    return redirect(url_for('show_first_generation_page'))

@app.route('/test/first-generation', methods=['GET'])
def show_first_generation_page():
    """Serve the HTML test page for the first image generation."""
    # return send_from_directory('templates', 'first-generation.html')
    # return send_file('templates/first-generation.html')
    return render_template('first-generation.html')

@app.route('/test/next-generation', methods=['GET'])
def show_next_generation_page():
    """Serve the HTML test page for the next image generation."""
    # return send_from_directory('templates', 'next-generation.html')
    # return send_file('templates/next-generation.html')
    return render_template('next-generation.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3500)
    # app.run(debug=True, port=8080)
