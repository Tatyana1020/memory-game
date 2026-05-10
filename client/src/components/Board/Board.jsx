import React from "react";
import Card from "../Card/Card";
import classes from "./Board.module.css";

const Board = ({ cards, handleCardClick, count }) => {

  const columns = Math.ceil(Math.sqrt(count*2));

  return (
    <div className={classes.container}>
      <div className={classes.gameBoard} style={{ '--cols': columns }}>
        {cards && cards.map((card) => (
          <Card
            key={card.id}
            symbol={card.symbol}
            isFlipped={card.isFlipped}
            isMatched={card.isMatched}
            onClick={() => handleCardClick(card)}
          />
        ))}
      </div>
    </div>
  );
};

export default Board;
