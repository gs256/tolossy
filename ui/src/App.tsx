import "./App.css";
import { FileSelection } from "./file-selection/FileSelection";

export function App() {
  return (
    <div>
      <h1>TODO</h1>
      <FileSelection />
      <button>Convert to mp3</button>
    </div>
  );
}
