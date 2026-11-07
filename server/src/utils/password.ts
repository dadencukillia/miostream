export const hashPassword = async (password: string): Promise<string> => {
    const hashedPassword = Bun.password.hash(password, { algorithm: "bcrypt" });
    return hashedPassword;
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
    const isMatch = await Bun.password.verify(password, hash);
    return isMatch;
};