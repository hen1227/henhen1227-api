import repl from 'repl';
import  { User, Club, ClubEvent } from '../models/Models.js'
import {deleteAllClubs, deleteClub} from "./Calendar.js";


const replServer = repl.start({ prompt: '> ' });

replServer.context.User = User;
replServer.context.Club = Club;
replServer.context.ClubEvent = ClubEvent;
replServer.context.deleteClub = deleteClub;
replServer.context.deleteAllClubs = deleteAllClubs;
