<div align="center">
  <img src="https://i.ibb.co/sgQn5mz/logo-with-text-colored.png">
</div>

# DecorAItion Planner: An AI-Assisted Project Decorating Application

**DecorAItion** is a progressive web app that uses Artificial Intelligence to visualize personalized designs for residential, commercial, and outdoor spaces. It can create AI-generated image recommendations tailored to the user's style and preferences for the venue or location. It also has project planning tools, including space mapping, project timeline, budget management, and display of relevant event details and related designs. But what truly sets it apart is its focus on community. It provides a cooperative interaction among app users to enable collaborative design, including sharing, managing, and commenting on designs. This feature fosters a sense of connection and shared creativity. It also has design history capabilities for tracking changes, restoring previous versions, and downloading and making copies of designs. Lastly, allows users to customize profile information, themes, and notification preferences through settings.

## 📚 Table of Contents

1. [Introduction](#-introduction)
2. [Features](#-features)
3. [System Architecture](#-system-architecture)
4. [Installation and Setup](#-installation-and-setup)
5. [User Guide](#-user-guide)
6. [Technologies Used](#-technologies-used)
7. [Screenshots & Demo](#-screenshots--demo)
8. [Acknowledgments](#-acknowledgments)

## 📖 Introduction

#### What's the problem?

Finding inspiration for decoration, whether for social events, interior, or exterior design, demands creativity and extensive effort. Designers traditionally spend significant time interpreting client preferences and iterating on layouts, furnishings, colors, and materials that often leads to delays and higher costs.

#### How we solved this?

DecorAItion Planner addresses these challenges by incorporating personalized design recommendations through AI image generation to accelerate the design process. This platform provides fast, AI-driven suggestions tailored to user preferences, reducing the time and effort required in the early stages of planning while offering innovative solutions for both personal and professional design needs.The objective of this project was to develop a web application powered by Artificial Intelligence (AI) that allows users to easily visualize concepts, receive a variety of design suggestions, and develop personalized layouts for residential, commercial, and outdoor spaces by using advanced tools and fostering collaboration, making it accessible to both novice and professional designers.

#### Who is it for?

- Event Decorators
  - Stage and Set Designers
  - Prop Designer
  - Production Designers
- Home Decorators
  - Interior Designers
  - Architects and Landscape Architects
  - Home Owners

## ✨ Features

- **Personalized Design Recommendations** \
  Users can generate images by typing a prompt that describes what they want and adjusting the number of images to generate. They can also upload a picture of the space or room, upload a style reference, and select a color palette. When a design has an existing version or images, users can refine their preferred image by selecting areas for refinement, typing a prompt of what to refine, and adjusting the number of images to generate. They can also upload a style reference and select a color palette to use in the refinement process.

- **Design & Project Homepage** \
  This user-friendly feature provides a comprehensive overview of recent designs and projects. Users can easily navigate through these in tiled or list views and have quick access to file and sharing functions, such as sharing with collaborators, making a copy, renaming and deleting the design or project, and viewing details. It also allows for efficient searching, sorting by owner, name, and date in ascending and descending order, and filtering by date modified and date created. Users can also initiate a new design or project directly from the homepage, making the process seamless and intuitive.

- **Design History** \
  This feature meticulously tracks all changes, ensuring users have complete control over their design process. It allows users to make a copy, restore a version, and view copies made in the design, providing a comprehensive record of its evolution.

- **Design Collaboration** \
  This feature allows users to share, manage designs, and communicate with collaborators through comments. The owner can set settings and permissions and receive notifications about updates, while design collaborators can edit and comment on the design and receive notifications about updates.

- **Budget Management** \
  This feature allows users to manage and track the design's budget according to their needs. Users can add a budget and input items needed in the design, allowing for an accurate estimation of the total cost. The feature also enables users to modify the details of the items and select which to add to the computation of the estimated total cost, giving them complete control over their resources and budget.

- **Venue/Plan Mapping** \
  Users can pin designs to a plan or venue map in a project. Pins can be ordered, have colors, and be adjusted. It also provides export options for printing and sharing digital copies of the plan with the proposed designs.

- **Project Timeline Management** \
  Users can create, track, and manage project events or schedules. It also allows PDF generation of the project timeline.

- **Project Collaboration** \
  Project Collaborators can cooperate on venue or plan mapping, project timeline, and project budget. The Project Manager can manage collaborators, set permissions, and manage the whole project.

- **Notification & Settings** \
  This allows push and in-app notifications to alert users of important events and updates. Notifications were triggered by specific events, such as being mentioned in comments or replies, new comments or replies, event reminders, and project or design collaborators. Users can mark a notification unread if they want to. They can also edit account information and notification settings through the settings to fit users' preferences. These include editing profile information, such as first name, last name, username, changing email, password, themes, and notification preferences.

## 🛠️ System Architecture

<div align="center">
    <h3>High-Level Class Diagram</h3>
</div>

<div>
<style>
td, th {
   border: none!important;
}
</style>
<table width="100%">
    <tr>
        <td colspan="2">To update description</td>
    </tr><tr></tr>
    <tr>
        <td colspan="2" height="300px">
            <picture>
                <source srcset="https://i.ibb.co/Wpy0YPL/Class-Diagram-High-Level-dark.png" media="(prefers-color-scheme: dark)">
                <img src="https://i.ibb.co/Pc1JbDY/Class-Diagram-High-Level.png" alt="User Use Case Diagram">
            </picture>
        </td>
    </tr><tr></tr>
</table>
</div>

<div align="center">
    <h3>Use Case Diagrams</h3>
</div>

<table width="100%">
    <tr>
        <td colspan="2"><b>User</b></td>
    </tr><tr></tr>
    <tr>
        <td colspan="2">To update description</td>
    </tr><tr></tr>
    <tr>
        <td colspan="2" height="300px">
            <picture>
                <source srcset="https://i.ibb.co/Pxyx3Cc/Use-Case-A-User-dark.png" media="(prefers-color-scheme: dark)">
                <img src="https://i.ibb.co/G9gSxkj/Use-Case-A-User.png" alt="User Use Case Diagram">
            </picture>
        </td>
    </tr><tr></tr>
    <tr>
        <td colspan="2" height="5px"></td>
    </tr><tr></tr>
    <tr>
        <td><b>Design Manager</b></td>
        <td><b>Design Collaborator</b></td>
    </tr><tr></tr>
    <tr>
        <td>To update description</td>
        <td>To update description</td>
    </tr><tr></tr>
    <tr>
        <td>
            <picture>
                <source srcset="https://i.ibb.co/BZq9tsn/Use-Case-D-Design-Manager-dark.png" media="(prefers-color-scheme: dark)">
                <img src="https://i.ibb.co/kHTJVFD/Use-Case-D-Design-Manager.png" alt="Project Manager Use Case Diagram">
            </picture>
        </td>
        <td>
            <picture>
                <source srcset="https://i.ibb.co/ZHBT6F7/Use-Case-E-Design-Collaborator-dark.png" media="(prefers-color-scheme: dark)">
                <img src="https://i.ibb.co/9TZjh59/Use-Case-E-Design-Collaborator.png" alt="Project Collaborators Use Case Diagram">
            </picture>
        </td>
    </tr><tr></tr>
    <tr>
        <td colspan="2" height="5px"></td>
    </tr><tr></tr>
    <tr>
        <td><b>Project Manager</b></td>
        <td><b>Project Collaborator</b></td>
    </tr><tr></tr>
    <tr>
        <td>To update description</td>
        <td>To update description</td>
    </tr><tr></tr>
    <tr>
        <td>
            <picture>
                <source srcset="https://i.ibb.co/B6Gbrdw/Use-Case-B-Project-Manager-dark.png" media="(prefers-color-scheme: dark)">
                <img src="https://i.ibb.co/2WTdqpt/Use-Case-B-Project-Manager.png" alt="Design Manager Use Case Diagram">
            </picture>
        </td>
        <td>
            <picture>
                <source srcset="https://i.ibb.co/TMjfSjY/Use-Case-C-Project-Collaborator-dark.png" media="(prefers-color-scheme: dark)">
                <img src="https://i.ibb.co/qBtsfHm/Use-Case-C-Project-Collaborator.png" alt="Design Collaborator Use Case Diagram">
            </picture>
        </td>
    </tr><tr></tr>
</table>

## 💻 Installation and Setup

### ✅ Prerequisites

### 1. Node.js Version

This web app was made with `Node.js v20.16.0`, but you may download the latest LTS version in the link below.

**Download Link:** https://nodejs.org/en

### 2. Python Version

To run the ai api, your computer must have: \
`Python 3.10.6`

If you're downgrading, uninstall "Python Launcher" from the "Control Panel" because you have higher Python version installed, so you can install it as administrator.

**Download Link:** https://www.python.org/downloads/release/python-3106/

**Recommended for Windows:** Windows installer (64-bit)

### ⚙️ Installation

### Step 1: Clone the repository and navigate to the project folder

```
git clone https://github.com/yourusername/your-repo.git
cd your-repo
```

### Step 2: Install front end and back end depencencies

Make sure you are in the project folder `decoraition`. The contents are `.vscode`, `ai-api`, `public`, `server`, `src` folders, and other configuration files, then run the following commands below.

```
npm install
cd server
npm install
```

### ▶️ Run the app

This will run the app in `http://localhost:3000`.

```
npm start
```

### 🔨 Build the app

Make sure all dependencies are installed and updated before building the app. See Step 2 of Installaion above on how to install dependencies. Run the command below to build the app.

```
npm run build
```

Once you see a `build` folder under `server` folder, run the command below and then you can access the built app in `http://localhost:5000`.

```
npm run server
```

### 🚀 Deploying the app

### Step 1: Updating the prod branch

Contact the developers to get access to Render and Cloudflare. \
[Developer Contact](#🤗-acknowledgments)

Go to the `prod` branch, and pull changes from the `main` branch.

```
git checkout prod
git pull origin main
```

### Step 2: Deploying to Render

Go to **Decoraition's Render Dashboard**, update your environment variables in the `Environment` tab if needed, then click `Manual Deploy` > `Clear build cache & deploy`. You can track your logs in the `Logs` tab of the dahsboard. If you see `Server is running on port 10000`, the app is successfully deployed.

### Step 3: Starting the AI API with Cloudflare Tunnel

### Prerequisites

- Setup **[irarayzelji2002/sd-webui-reForge-decoraition](https://github.com/irarayzelji2002/sd-webui-reForge-decoraition)** by following the instructions in the `README`.
- Install **[Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/)**
  - Login to Cloudflare in Cloudflare Tunnel by typing this in the terminal after installation.
    `cloudflared login`

### Setup and Configuration

- Create the tunnel by typing this in the terminal `cloudflared tunnel create ai-api`.
- Go to `C:\Users\PCUser\.cloudflared`
- Create file `config.yml` if not yet present, copy the following content to the file and save.

```
tunnel: ee26a08e-6a2a-478e-8c84-d9ef99470759
credentials-file: C:\Users\PCUSer\.cloudflared\ee26a08e-6a2a-478e-8c84-d9ef99470759.json

ingress:
    - hostname: ai-api.decoraition.org
      service: http://localhost:3500
    - service: http_status:404
```

`ee26a08e-6a2a-478e-8c84-d9ef99470759.json` is the credentials file and may be different for yours, so make sure its referencing the correct file, it is also the **tunnel id**.

Make sure the structure of the folders are like this:

```
parent-folder
|--.vscode
|--tasks.json
|--decoraition (make sure same name)
|--stable-diffusion-webui-reForge (make sure same name)
```

If you have different folder names, you can rename or change the `cwd` in `tasks.json` to your folder paths

### Starting the API</span>

Open the parent-folder (any name) in VSCode, then open the terminal, click the `+` icon, click `Run Task...` and select `Start AI API`.

### 🔐 Environment variables, database, and other access

Contact the developers to get access to the environment variables and database. \
[Developer Contact](#🤗-acknowledgments)

## 📑 User Guide

Decoraition's **User Manual** can be browsed [here](https://drive.google.com/file/d/1pYIDrWBa8NW7aIwkMJ7goxueACNSta81/view?usp=drive_link).

<table width="100%">
    <tr>
        <td>
            <picture>
                <img src="" alt="User Manual Cover">
            </picture>
        </td>
        <td>
            <picture>
                <img src="" alt="User Manual TOC">
            </picture>
        </td>
        <td>
            <picture>
                <img src="" alt="User Manual TOC">
            </picture>
        </td>
    </tr><tr></tr>
</table>

## 🤖 Technologies Used

- **Front End:** \
  HTML, CSS, Javascript, React, Material UI
- **Back End:** \
  Express.js
- **Database & Cloud Service:** \
  Firebase, Google Cloud Platform
- **AI Image Generation:** \
  Python

  - **[Stable Diffusion WebUI Forge/reForge](https://github.com/irarayzelji2002/sd-webui-reForge-decoraition)**
    - Generating image: realisticVisionV51 - VAE
    - Generating masks: Segment Anything Model (SAM) - ViT Base
    - Controlling image diffusion (base image and style reference): ControlNet

- **UI/UX & Graphics:** \
  [Figma](https://www.figma.com/design/EaeyHXMwUQ0MiQuCg4lwUP/DecorAItion?node-id=0-1&p=f&t=wahXxGoEsi7wjjOL-0), Adobe Illustrator
- **Hosting:** \
  Render, Cloudflare

## 📸 Screenshots & Demo

## 🤗 Acknowledgments

This is a capstone project presented to the Department of Information Technology, College of Information and Computing Sciences of the University of Santo Tomas in partial fulfillment of the requirements for the degree in Bachelor of Science in Information Technology Specialization in Web and Mobile Development.

**ACM Conference Paper:** [Decoraition Conference Paper](https://drive.google.com/file/d/1pYIDrWBa8NW7aIwkMJ7goxueACNSta81/view?usp=drive_link)

This project was a collaborative effort with:

**Proponents:**

- **Jakob Michael M. Palomo** ([JakobPalomo](https://github.com/JakobPalomo)) <<jakobmichael.palomo.cics@ust.edu.ph>>
- **Ira Rayzel S. Ji** ([irarayzelji2002](https://github.com/irarayzelji2002)) <<irarayzel.ji.cics@ust.edu.ph>>
- **Aliah DR. Esteban** ([aliahestbn](https://github.com/aliahestbn)) <<aliah.esteban.cics@ust.edu.ph>>
- **Yna Sophia Del Rosario** ([YnaSophiaDR](https://github.com/YnaSophiaDR)) <<ynasophia.delrosario.cics@ust.edu.ph>>

**Technical Adviser:**

- **Asst. Prof. Ronina C. Tayuan, MSCS** <<rctayuan@ust.edu.ph>>
