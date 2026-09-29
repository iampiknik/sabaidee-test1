import { Sidebar } from "./components/Sidebar";
import { SalesPage } from "./pages/SalesPage";

function App() {
  return (
    <div style={{ display: "flex", height: "100%" }}>
      <Sidebar active="sales" />
      <SalesPage />
    </div>
  );
}

export default App;
