import React from "react";
import styles from "./Button.module.css";
interface ButtonProps {
    onClick?: () => void;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    text?: string;
    disabled?: boolean;
    variant?: "red" | "black";
    children?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ onClick, onMouseEnter, onMouseLeave, text, disabled, variant='red', children }) => {
    return (
        <button className={`${styles.button} ${styles[variant]}`} onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} disabled={disabled}>
            {children || text}
        </button>
    );
};


export default Button;