import { User, Club, ClubEvent } from '../models/Models.js'

export const deleteClub = async (clubId) => {
    try {
        const result = await Club.destroy({ where: { id: clubId } });
        console.log(`Deleted ${result} club(s)`);
    } catch (error) {
        console.error("Error deleting club:", error);
    }
}

export const deleteAllClubs = async () => {
    try {
        const result = await Club.destroy({ where: {} });
        console.log(`Deleted ${result} club(s)`);
    } catch (error) {
        console.error("Error deleting all clubs:", error);
    }
}