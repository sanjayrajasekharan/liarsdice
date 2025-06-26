import React from "react";
import styles from "./ClaimBanner.module.css";

import oneSvg from "../../assets/dice/one.svg?url";
import twoSvg from "../../assets/dice/two.svg?url";
import threeSvg from "../../assets/dice/three.svg?url";
import fourSvg from "../../assets/dice/four.svg?url";
import fiveSvg from "../../assets/dice/five.svg?url";
import sixSvg from "../../assets/dice/six.svg?url";

interface ClaimBannerProps {
    currentClaim: {
        value: number;
        quantity: number;
    };
    userName: string;
}

const diceSvgs: Record<number, string> = {
    1: oneSvg,
    2: twoSvg,
    3: threeSvg,
    4: fourSvg,
    5: fiveSvg,
    6: sixSvg,
};

const ClaimBanner: React.FC<ClaimBannerProps> = ({ currentClaim, userName }) => {
    return (
        <div className={styles.claimBanner}>
            <div className={styles.claim}>
                <span >{currentClaim.quantity} ×</span>
                {diceSvgs[currentClaim.value] && (
                    <img
                        className={styles.dieImage}
                        src={diceSvgs[currentClaim.value]}
                        alt={`Die showing ${currentClaim.value}`}
                    />
                )}
                
            </div>
            <div className={styles.userName}>
                -- {userName}
            </div>
        </div>
    );
};

export default ClaimBanner;
