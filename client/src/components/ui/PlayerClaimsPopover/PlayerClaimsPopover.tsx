import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as Popover from "@radix-ui/react-popover";
import clsx from "clsx";
import { diceSvgs } from "../../../assets/dice";
import { ClaimHistoryItem } from "../../../services/gameService";

interface PlayerClaimsPopoverProps {
    playerName: string;
    claims: ClaimHistoryItem[];
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    children: React.ReactNode;
}

const popoverVariants = {
    initial: { opacity: 0 },
    animate: { 
        opacity: 1, 
        transition: {
            duration: 0.15,
            ease: "easeOut"
        }
    },
    exit: { 
        opacity: 0,
        transition: {
            duration: 0.1
        }
    }
};

const itemVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
};

const PlayerClaimsPopover: React.FC<PlayerClaimsPopoverProps> = ({
    playerName,
    claims,
    isOpen,
    onOpenChange,
    children,
}) => {
    // Sort claims by claim number (most recent first)
    const sortedClaims = [...claims].sort((a, b) => b.claimNumber - a.claimNumber);

    return (
        <Popover.Root open={isOpen} onOpenChange={onOpenChange}>
            <Popover.Trigger asChild>
                {children}
            </Popover.Trigger>
            
            <AnimatePresence>
                {isOpen && (
                    <Popover.Portal forceMount>
                        <Popover.Content
                            asChild
                            side="bottom"
                            sideOffset={8}
                            align="center"
                            collisionPadding={16}
                            avoidCollisions={true}
                        >
                            <motion.div
                                className={clsx(
                                    "z-50 w-56 rounded-xl shadow-lg",
                                    "bg-surface-elevated border border-border-light",
                                    "overflow-hidden"
                                )}
                                variants={popoverVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                            >
                                {/* Header */}
                                <div className="px-4 py-3 border-b border-border-light bg-surface-secondary">
                                    <h3 className="text-sm font-semibold text-text-primary">
                                        {playerName}'s Claims
                                    </h3>
                                </div>

                                {/* Claims list */}
                                {sortedClaims.length > 0 ? (
                                    <motion.div 
                                        className="max-h-48 overflow-y-auto"
                                        initial="initial"
                                        animate="animate"
                                        transition={{ staggerChildren: 0.05 }}
                                    >
                                        {sortedClaims.map((claim, index) => (
                                            <motion.div
                                                key={claim.claimNumber}
                                                className={clsx(
                                                    "flex items-center justify-between px-4 py-2",
                                                    "border-b border-border-light last:border-b-0",
                                                    index === 0 && "bg-primary-50"
                                                )}
                                                variants={itemVariants}
                                            >
                                                <span className="text-xs text-text-tertiary font-mono">
                                                    #{claim.claimNumber}
                                                </span>
                                                
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-text-primary">
                                                        {claim.quantity}
                                                    </span>
                                                    <div className="w-px h-4 bg-border-medium" />
                                                    <img
                                                        src={diceSvgs[claim.faceValue]}
                                                        alt={`Die showing ${claim.faceValue}`}
                                                        className="h-5 w-5"
                                                    />
                                                </div>
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                ) : (
                                    <div className="px-4 py-6 text-center">
                                        <p className="text-sm text-text-tertiary">
                                            No claims yet
                                        </p>
                                    </div>
                                )}

                                {/* Footer */}
                                <div className="px-4 py-2 border-t border-border-light bg-surface-secondary">
                                    <p className="text-xs text-text-tertiary text-center">
                                        {sortedClaims.length} claim{sortedClaims.length !== 1 ? 's' : ''} this round
                                    </p>
                                </div>

                                <Popover.Arrow className="fill-surface-elevated" />
                            </motion.div>
                        </Popover.Content>
                    </Popover.Portal>
                )}
            </AnimatePresence>
        </Popover.Root>
    );
};

export default PlayerClaimsPopover;
