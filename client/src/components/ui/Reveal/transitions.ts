
export const containerVariants = {
    hidden: { 
        opacity: 0,
        scale: 0.5,
        // y: 50
    },
    show: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            duration: 0.6,
            type: "spring",
            bounce: 0.1,
            delayChildren: 0.8, // wait for table animation to complete
            staggerChildren: 1, // delay between each row
        },
    },
};

export const rowVariants = {
    hidden: { opacity: 1 },
    show: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.3,
            staggerChildren: 0.1
        },
    },
};

export const footerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            duration: 0.5,
        },
    },
}

export const diceContainerVariants = {
    hidden: {},
    show: {
        transition: {
            staggerChildren: 0.1, // delay between each die
        },
    },
};

export const dieVariants = {
    hidden: { opacity: 0, scale: 0, x: 10 },
    show: { 
        opacity: 1, 
        scale: 1, 
        x: 0,
        transition: {
            duration: 0.5
        },
    },
};

export const eggVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: 0.5 } },
};