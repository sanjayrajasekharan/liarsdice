import React from "react";
import styles from "./Card.module.css";

interface CardProps {
    title: string;
    children: React.ReactNode;
    error?: string;
}
const Card: React.FC<CardProps> = ({ title, children, error }) => {
    return (
        <div className={styles.card}>
            <h1 className={styles.title}>
                <em>{title}</em>
            </h1>
            <div className={styles.form_group}>{children}</div>
            <div className={styles.error_message}>{error || " "}</div>
        </div>
    );
};

export default Card;
