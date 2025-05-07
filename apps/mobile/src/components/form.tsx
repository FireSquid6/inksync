import { FilePicker } from "@capawesome/capacitor-file-picker";

export interface TextInputProps {
  state: string;
  onChange?: (s: string) => void;
  label: string;
  placeholder?: string;
}

export function TextInput(props: TextInputProps) {
  return (
    <fieldset className="fieldset w-[16rem]">
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
  setState: (s: string) => void;
  state: string;
}

export function FileInput(props: FileInputProps) {
  const onClick = async () => {
    try {
      switch (props.type) {
        case "directory":
          console.log("Starting directory pick:");

          try {

            const dir = await FilePicker.pickDirectory();
            console.log("Got:", dir);
            props.setState(dir.path);
          } catch (e) {
            console.log("Got an error:");
            console.log(e);
          }

          break;
        case "file":
          const { files } = await FilePicker.pickFiles({ limit: 1 });
          if (files.length !== 1) {
            throw new Error("somehow picked more than 1 file");
          }
          props.setState(files[0].path ?? "No path...");
          break;
      }
    } catch (e) {
      console.log("Error picking directory:")
      console.log(e);
    }
  }

  return (
    <fieldset className="fieldset flex flex-row">
      <button className="btn" onClick={onClick}>Pick {props.type}</button>
      <p className="w-full text-md  my-auto">{props.state}</p>
    </fieldset>
  )

}
