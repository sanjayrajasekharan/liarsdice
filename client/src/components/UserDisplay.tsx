import React from "react";

interface UserDisplayProps {
  userName: string;
  userIcon: string; // Expecting an emoji
  size?: number;
}

const UserDisplay: React.FC<UserDisplayProps> = ({ userName, userIcon, size=80}) => {
  return (
    <div style={styles.container}>
      <div style={{...styles.iconContainer, width: `${size}px`, height: `${size}px`}}>
        <span style={{...styles.icon, fontSize: `${55/88 * size}px`}}>{userIcon}</span>
      </div>
      <p style={styles.userName}>{userName}</p>
    </div>
  );
};

// Inline styles
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },
  iconContainer: {
    borderRadius: "50%",
    backgroundColor: "#f0f0f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "80px",
    boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
  },
  icon: {
    // fontSize: "55px",
  },
  userName: {
    marginTop: "8px",
    fontSize: "16px",
    fontWeight: "bold",
    color: "#333",
  },
};

export default UserDisplay;
