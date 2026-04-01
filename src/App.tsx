import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index.tsx";
import Carousel from "./pages/Carousel.tsx";

const App = () => (
  <BrowserRouter basename={import.meta.env.BASE_URL}>
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/carousel" element={<Carousel />} />
    </Routes>
  </BrowserRouter>
);

export default App;
