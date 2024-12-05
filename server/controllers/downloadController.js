exports.downloadImage = async (req, res) => {
  try {
    const imageUrl = req.query.url;
    const filename = req.query.filename;
    const response = await fetch(imageUrl);
    const buffer = await response.buffer();

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}.png`);

    console.log("buffer", buffer);
    res.send(buffer);
  } catch (error) {
    console.error("Error downloading image:", error);
    res.status(500).send("Error downloading image");
  }
};
