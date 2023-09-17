import UserModel from './UserModel.js';
import DeviceTokenModel from './DeviceTokenModel.js';
import MinecraftEventModel from './MinecraftEventModel.js';
import MinecraftAccountModel from "./MinecraftAccountModel.js";
import PurchaseModel from './PurchaseModel.js';
import ShopItemModel from './ShopItemModel.js';
import GameWinModel from "./GameWinModel.js";
import FundingPaymentModel from "./FundingPaymentModel.js";
import FundingCostModel from "./FundingCostModel.js";
import FundingTotalModel from "./FundingTotalModel.js";
import sequelize from "./Sequelize.js";
import ClubModel from "./ClubModel.js";
import ClubEventModel from "./ClubEventModel.js";

export const Purchase = PurchaseModel
export const GameWin = GameWinModel
export const MinecraftEvent = MinecraftEventModel
export const MinecraftAccount = MinecraftAccountModel
export const Club = ClubModel
export const ClubEvent = ClubEventModel
export const ShopItem = ShopItemModel
export const User = UserModel
export const DeviceToken = DeviceTokenModel
export const FundingPayment = FundingPaymentModel
export const FundingCost = FundingCostModel
export const FundingTotal = FundingTotalModel

MinecraftAccount.hasMany(Purchase, { foreignKey: 'mcId' });
Purchase.belongsTo(MinecraftAccount, { foreignKey: 'mcId' });

ShopItem.hasMany(Purchase, { foreignKey: 'itemId'});
Purchase.belongsTo(ShopItem, { foreignKey: 'itemId' });

MinecraftAccount.hasMany(GameWin, { foreignKey: 'mcId' });
GameWin.belongsTo(MinecraftAccount, { foreignKey: 'mcId' });


User.hasMany(FundingPayment, { foreignKey: 'userId' });
FundingPayment.belongsTo(User, {
    foreignKey: 'userId',
    constraints: false // This allows for payments to not necessarily have a user associated
});


User.hasMany(DeviceToken, { foreignKey: 'userId', onDelete: 'CASCADE' });


Club.hasMany(ClubEvent, { foreignKey: 'clubId', onDelete: 'CASCADE' });
ClubEvent.belongsTo(Club, { foreignKey: 'clubId', onDelete: 'CASCADE' });

// Many-to-many relationship for leaders of a club
User.belongsToMany(Club, { as: 'LedClubs', through: 'ClubLeaders', onDelete: 'CASCADE' });
Club.belongsToMany(User, { as: 'Leaders', through: 'ClubLeaders', onDelete: 'CASCADE' });

// Many-to-many relationship for members of a club (subscribers)
User.belongsToMany(Club, { as: 'SubscribedClubs', through: 'ClubMembers', onDelete: 'CASCADE' });
Club.belongsToMany(User, { as: 'Subscribers', through: 'ClubMembers', onDelete: 'CASCADE' });
