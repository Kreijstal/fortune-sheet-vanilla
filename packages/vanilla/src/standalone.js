// Entry for the single-file <script> build: exposes `FortuneSheet` globally.
import { FortuneSheet } from "./index.js";

globalThis.FortuneSheet = FortuneSheet;
export default FortuneSheet;
