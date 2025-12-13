import axios from 'axios';

export const axiosClient = axios.create({
timeout: 12_000, // 12 seconds
headers: {
'Content-Type': 'application/json',
'User-Agent': 'Mozilla/5.0 (Contest-Reminder/1.0)'
},
});