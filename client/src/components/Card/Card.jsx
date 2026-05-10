import React, { useState } from "react";
import classes from "./Card.module.css";

const Card = ({ symbol, isFlipped, isMatched, onClick }) => {
  const cardClass = `${classes.card} ${isFlipped ? classes.flipped : classes.closed} ${isMatched ? classes.hidden : ""}`;

  return (
    <div className={cardClass} onClick={onClick}>
      {isFlipped && <span className={classes.symbol}>{symbol}</span>}
    </div>
  );
};

export default Card;
