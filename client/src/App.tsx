import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Drop from "./pages/Drop";
import Admin from "./pages/Admin";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/drop" element={<Drop />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}
