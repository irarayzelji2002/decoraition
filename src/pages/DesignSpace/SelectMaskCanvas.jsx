function SelectMaskCanvas({ selectedImage }) {
  return (
    <div>
      <div className="">
        <div className="">
          <img src={selectedImage.link} alt="" className="image-preview" />
        </div>
      </div>
    </div>
  );
}

export default SelectMaskCanvas;
