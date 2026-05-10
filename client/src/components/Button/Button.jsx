import React from "react";
import classes from "./Button.module.css";


const Button = (props) => {
  return (
    <div className={`${classes.wrapper} ${props.className || ""}`}>
      <button className={`${classes.btn} ${props.className || ""}`} onClick={props.onClick} disabled={props.disabled}>
        {props.children}
        </button>
    </div>
  );
};

export default Button;
