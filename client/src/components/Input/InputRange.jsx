import React from "react";
import classes from "./InputRange.module.css";

const InputNumber = ({ min, max, step, style, className, onChange, value, ...props }) => {
  const handleChange = (e) => {
    const val = Number(e.target.value);
    onChange(val);
  };

  return (
    <div className={`${classes.rangeWrapper} ${className || ""}`} style={style}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        className={`${classes.rangeInput} ${className || ""}`}
        value={value}
        onChange={handleChange}
        {...props}
      />
      <div className={classes.rangeValue}>
        {value}
      </div>
    </div>
  );
};

export default InputNumber;
