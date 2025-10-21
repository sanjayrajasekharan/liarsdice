import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { GameService } from "../services/gameService";
import { useGameState } from "../store/gameStore";
import { GameStage, PublicPlayer } from "../../../shared/types";
import DiceRoll from "./DiceRoll/DiceRoll";
import DiceSvg from "./DiceSvg/DiceSvg";
import styles from "./GameRoomNew.module.css";

const GameRoomNew: React.FC = () => {
};

export default GameRoomNew;
