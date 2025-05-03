import { FilePicker } from "@capawesome/capacitor-file-picker";
import { useState } from "react";

export interface TextInputProps {
  state: string;
  onChange?: (s: string) => void;
  label: string;
  placeholder?: string;
}

export function TextInput(props: TextInputProps) {
  return (
    <fieldset className="fieldset">
      <legend className="fieldset-legend">{props.label}</legend>
      <input type="text" className="input" placeholder={props.placeholder} value={props.state} onChange={(e) => {
        if (props.onChange !== undefined) {
          props.onChange(e.target.value);
        }
      }} />
    </fieldset>
  )
}


export interface FileInputProps {
  type: "directory" | "file";
}

export function FileInput(props: FileInputProps) {
  const [picked, setPicked] = useState<string>("");

  const onClick = async () => {
    switch (props.type) {
      case "directory":
        const dir = await FilePicker.pickDirectory();
        setPicked(dir.path);
        break;
      case "file":
        const { files } = await FilePicker.pickFiles({ limit: 1 });
        if (files.length !== 1) {
          throw new Error("somehow picked more than 1 file");
        }
        setPicked(files[0].path ?? "No path...");
        break;
    }
  }

  return (
    <fieldset className="fieldset">
      <button onClick={onClick}>Pick {props.type}</button>
      <p>{picked}</p>
    </fieldset>
  )

}
