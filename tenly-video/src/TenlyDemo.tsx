import { AbsoluteFill, Sequence } from "remotion";
import { bg } from "./theme";
import { IntroLogo } from "./scenes/IntroLogo";
import { WrongQuestion } from "./scenes/WrongQuestion";
import { OutroScene } from "./scenes/OutroScene";
import { LogScoreScene } from "./scenes/LogScoreScene";
import { DashboardScene } from "./scenes/DashboardScene";

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
        <LogScoreScene />
      </Sequence>
      <Sequence from={990} durationInFrames={540} layout="none">
        <DashboardScene />
      </Sequence>
      <Sequence from={1530} durationInFrames={270} layout="none">
        <OutroScene />
      </Sequence>
    </AbsoluteFill>
  );
};
