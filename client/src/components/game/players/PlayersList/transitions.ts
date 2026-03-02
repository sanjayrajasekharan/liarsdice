export const containerVariants = {
    hidden: { 
        opacity: 0,
        scale: 0.95,
    },
    show: {
        opacity: 1,
        scale: 1,
        transition: {
            duration: 0.4,
            type: "spring",
            bounce: 0.1,
            staggerChildren: 0.1, // delay between each row
        },
    },
};

export const rowVariants = {
    hidden: { 
        opacity: 0.3,
        x: -20,
    },
    show: {
        opacity: 1,
        x: 0,
        transition: {
            duration: 0.3,
            type: "spring",
            bounce: 0.2,
        },
    },
    empty: {
        opacity: 0.3,
        x: 0,
        transition: {
            duration: 0.3,
            type: "spring",
            bounce: 0.2,
        },
    },
};

export const playerInfoVariants = {
    hidden: { 
        opacity: 0,
        scale: 0.3,
    },
    show: {
        opacity: 1,
        scale: 1,
        transition: {
            duration: 0.5,
            type: "spring",
            bounce: 0.4,
            delay: 0.1,
        },
    },
    empty: {
        opacity: 0.4,
        scale: 0.8,
        transition: {
            duration: 0.3,
            type: "spring",
            bounce: 0.2,
        },
    },
};

export const badgeVariants = {
    hidden: { 
        opacity: 0,
        scale: 0,
        rotate: -180,
    },
    show: {
        opacity: 1,
        scale: 1,
        rotate: 0,
        transition: {
            duration: 0.4,
            type: "spring",
            bounce: 0.6,
            delay: 0.2,
        },
    },
};