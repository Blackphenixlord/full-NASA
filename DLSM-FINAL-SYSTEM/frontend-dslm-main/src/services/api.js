import axios from "axios";

// Local mock server (run `npm run start:server`).
const API_BASE_URL = "http://localhost:4000/api";

export const getShipments = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/shipments/`);
        return response.data;
    } catch (error) {
        console.error("Error fetching shipments:", error);
        return [];
    }
};

export const getMockData = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/mock-data`);
        return response.data;
    } catch (error) {
        console.error("Error fetching mock data:", error);
        return null;
    }
};

export const scanRfid = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/rfid/scan`);
        return response.data;
    } catch (error) {
        console.error("Error scanning RFID:", error);
        return null;
    }
};

export const pairRfid = async (uid, itemId) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/rfid/pair`, { uid, itemId });
        return response.data;
    } catch (error) {
        console.error('Error pairing RFID:', error);
        return null;
    }
};

export const getManifest = async (shipmentId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/manifests/${shipmentId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching manifest:', error);
        return null;
    }
};

export const getItem = async (itemId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/items/${itemId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching item:', error);
        return null;
    }
};

// Add more functions here to fetch Manifests, Items, etc.