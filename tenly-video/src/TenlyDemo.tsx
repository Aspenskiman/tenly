import { AbsoluteFill, Sequence } from "remotion";
import { bg } from "./theme";
import { IntroLogo } from "./scenes/IntroLogo";
import { WrongQuestion } from "./scenes/WrongQuestion";

const Placeholder: React.FC<{ readonly label: string; readonly color: string }> = ({
  label,
  color,
}) => (
  <AbsoluteFill
    style={{
      backgroundColor: color,
      color: "white",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 48,
      fontFamily: "sans-serif",
    }}
  >
    {label}
  </AbsoluteFill>
);

export const TenlyDemo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: bg }}>
      <Sequence durationInFrames={180} layout="none">
        <IntroLogo />
      </Sequence>
      <Sequence from={180} durationInFrames={210} layout="none">
        <WrongQuestion />
      </Sequence>
      <Sequence from={390} durationInFrames={600} layout="none">
        <Placeholder label="Scene 3 — LogScore (13–33s)" color={bg} />
      </Sequence>
      <Sequence from={990} durationInFrames={510} layout="none">
        <Placeholder label="Scene 4 — Dashboard (33–50s)" color={bg} />
      </Sequence>
      <Sequence from={1500} durationInFrames={300} layout="none">
        <Placeholder label="Scene 5 — Outro (50–60s)" color="#000" />
      </Sequence>
    </AbsoluteFill>
  );
};
