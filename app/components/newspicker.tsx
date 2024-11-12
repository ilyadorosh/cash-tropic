import React, { useState, useEffect } from "react";
import "./newspicker.scss";

interface NewsPickerProps {
  value: string;
  greyout: string;
  nolabel: boolean;
  nobutton: boolean;
}

const NewsPicker: React.FC<NewsPickerProps> = ({
  value,
  greyout,
  nolabel,
  nobutton,
}) => {
  const [selectedValue, setSelectedValue] = useState(value);

  useEffect(() => {
    // Update the selected value when the component receives new props
    setSelectedValue(value);
  }, [value]);

  const handleRadioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedValue(event.target.value);
  };

  const updateRadioButtons = () => {
    // Update the disabled state of radio buttons based on the 'greyout' prop
    const radioButtons = document.querySelectorAll<HTMLInputElement>(
      'input[type="radio"]',
    );
    if (radioButtons) {
      if (greyout) {
        const greyoutValues = greyout.split(",").map((v) => v.trim());
        radioButtons.forEach((radioButton) => {
          radioButton.disabled = greyoutValues.includes(radioButton.value);
        });
      }
    }
  };

  useEffect(updateRadioButtons, [greyout]); // Update radio buttons when 'greyout' changes

  return (
    <div
      className={`news-container ${nolabel ? "no-label" : ""} ${
        nobutton ? "no-button" : ""
      }`}
    >
      <div className="flag">
        <div className="black"></div>
        <div className="red"></div>
        <div className="gold"></div>
      </div>
      <label></label>
      <label>
        <input
          type="radio"
          name="direction"
          value="North"
          checked={selectedValue === "North"}
          onChange={handleRadioChange}
        />
        <span className="letter" id="north-letter">
          N
        </span>
      </label>
      <label></label>
      <label>
        <input
          type="radio"
          name="direction"
          value="West"
          checked={selectedValue === "West"}
          onChange={handleRadioChange}
        />
        <span className="letter" id="west-letter">
          W
        </span>
      </label>
      <label>
        <input
          type="radio"
          name="direction"
          value="Replace"
          checked={selectedValue === "Replace"}
          onChange={handleRadioChange}
        />
        <span className="letter" id="inside-letter">
          X
        </span>
      </label>
      <label>
        <input
          type="radio"
          name="direction"
          value="East"
          checked={selectedValue === "East"}
          onChange={handleRadioChange}
        />
        <span className="letter" id="east-letter">
          E
        </span>
      </label>
      <label></label>
      <label>
        <input
          type="radio"
          name="direction"
          value="South"
          checked={selectedValue === "South"}
          onChange={handleRadioChange}
        />
        <span className="letter" id="south-letter">
          S
        </span>
      </label>
      <label></label>
    </div>
  );
};

export default NewsPicker;
