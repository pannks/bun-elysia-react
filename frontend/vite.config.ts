import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        host: "0.0.0.0",
        port: 4173 // This can be omitted since it's the default
    }
});
