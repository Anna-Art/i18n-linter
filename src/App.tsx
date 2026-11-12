import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { KeyValidationPage } from "./pages/KeyValidationPage";
import { SummaryPage } from "./pages/SummaryPage";
import { NavBar } from "./components/NavBar/NavBar";
import "./App.css";

function App() {
    return (
        <BrowserRouter>
            <NavBar />
            <Routes>
                <Route path="/" element={<KeyValidationPage />} />
                <Route path="/summary" element={<SummaryPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
