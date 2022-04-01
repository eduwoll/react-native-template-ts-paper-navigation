import { Stream, Streams } from "../components/create-video-steps/RenderVideo";
import { intros } from "./links";

export const silentIntroNames: Array<keyof typeof intros | ""> = [
  "hinos",
  "hinos_especiais",
];

export function getRenderCommands(
  streams: Streams,
  sourceStartTime: number,
  sourceEndTime: number,
  silentIntro: boolean
): string[] {
  const { intro, source: sourceAV, outro, sourceVideo, sourceAudio } = streams;

  console.log(streams);

  if (!sourceAV && !sourceVideo) return [];

  const source = (sourceAV || sourceVideo) as Stream;

  const result: string[] = [];

  var introIndex = 0,
    sourceIndex = 0,
    outroIndex = 0,
    audioIndex = 0;
  var currentIndex = 0;

  var fc = "";

  const contentDuration = sourceEndTime - sourceStartTime;

  const totalDuration =
    contentDuration +
    (intro.path && !silentIntro ? intro.duration : 0) +
    (outro.path ? outro.duration : 0);

  if (intro.path) {
    result.push("-i", intro.path);
    introIndex = currentIndex++;
    fc += `
    [${introIndex}:v]
      scale=1280:720:force_original_aspect_ratio=decrease,
      pad=1280:720:-1:-1:color=black,
      setdar=16/9,
      settb=AVTB,
      fps=30/1,
      split=2[intro1][intro2];`;
  }

  result.push("-ss", `${sourceStartTime}`);
  result.push("-i", source.path);
  result.push("-t", `${totalDuration}`);

  sourceIndex = currentIndex++;
  audioIndex = sourceIndex;
  fc += `
  [${sourceIndex}:v]
    scale=1280:720:force_original_aspect_ratio=decrease,
    pad=1280:720:-1:-1:color=black,
    setdar=16/9,
    settb=AVTB,
    fps=30/1`;
  if (intro.path && outro.path)
    fc += `,split=3[source_in][source_body][source_out];`;
  else if (intro.path) fc += `,split=2[source_in][source_body];`;
  else if (outro.path) fc += `,split=2[source_body][source_out];`;
  else fc += `[source_body];`;

  if (outro.path) {
    result.push("-i", outro.path);
    outroIndex = currentIndex++;
    fc += `
    [${outroIndex}:v]
      scale=1280:720:force_original_aspect_ratio=decrease,
      pad=1280:720:-1:-1:color=black,
      setdar=16/9,
      settb=AVTB,
      fps=30/1,
      split=2[outro1][outro2];`;
  }

  if (sourceAudio) {
    result.push("-ss", `${sourceStartTime}`);
    result.push("-i", sourceAudio.path);
    result.push("-t", `${totalDuration}`);
    audioIndex = currentIndex++;
  }

  if (intro.path) {
    fc += `
    [intro1]
      trim=
        start=0:
        end=${streams.intro.duration - 1},
      setpts=PTS-STARTPTS[intro];
    [intro2]
      trim=
        start=${streams.intro.duration - 1},
      setpts=PTS-STARTPTS[introfadeout]; `;

    if (!silentIntro)
      fc += `[source_in]
        trim=
          end=1,
          setpts=PTS-STARTPTS[sourcefadein];
      [source_body]
        ${!outro.path ? `fade=t=out:st=${contentDuration - 2}:d=2,` : ""}
        trim=
          start=1:
          end=${outro.path ? contentDuration - 1 : contentDuration},
        setpts=PTS-STARTPTS[source];`;
    else {
      fc += `[source_in]
        trim=
          start=${intro.duration - 1}:
          end=${intro.duration},
          setpts=PTS-STARTPTS[sourcefadein];
      [source_body]
        ${!outro.path ? `fade=t=out:st=${contentDuration - 2}:d=2,` : ""}
        trim=
          start=${intro.duration}:
          end=${outro.path ? contentDuration - 1 : contentDuration},
        setpts=PTS-STARTPTS[source];`;
    }

    fc += `
    [sourcefadein]
      format=pix_fmts=yuva420p,
      fade=
        t=in:
        st=0:
        d=1:
        alpha=1[fadein];
    [introfadeout]
      format=pix_fmts=yuva420p,
      fade=
        t=out:
        st=0:
        d=1:
        alpha=1[fadeout];
    [fadein]fifo[fadeinfifo];
    [fadeout]fifo[fadeoutfifo];
    [fadeoutfifo][fadeinfifo]overlay[crossfade];`;
  } else {
    fc += `
    [source_body]
      ${!outro.path ? `fade=t=out:st=${contentDuration - 2}:d=2,` : ""}
      trim=
        end=${outro.path ? contentDuration - 1 : contentDuration},
        setpts=PTS-STARTPTS[source]; `;
  }

  if (outro.path) {
    fc += `
    [source_out]
      trim=
        start=${contentDuration - 1}:
        end=${contentDuration},
      setpts=PTS-STARTPTS[sourcefadeout];

    [outro2]
      trim=
        start=0:
        end=1,
      setpts=PTS-STARTPTS[outrofadein];
    [outro1]
      trim=
        start=1,
      setpts=PTS-STARTPTS[outro];  
    [outrofadein]
      format=pix_fmts=yuva420p,
      fade=
        t=in:
        st=0:
        d=1:
        alpha=1[fadein2];
    [sourcefadeout]
      format=pix_fmts=yuva420p,
      fade=
        t=out:
        st=0:
        d=1:
        alpha=1[fadeout2];
    [fadein2]fifo[fadeinfifo2];
    [fadeout2]fifo[fadeoutfifo2];
    [fadeoutfifo2][fadeinfifo2]overlay[crossfade2];`;
  }

  if (intro.path && outro.path) {
    fc += `
    [intro][crossfade][source][crossfade2][outro]concat=n=5[v];`;

    if (!silentIntro)
      fc += `
      [${audioIndex}:a]
        atrim=
          end=${contentDuration}[sourcetrimmed];
      [${introIndex}:a][sourcetrimmed]acrossfade=d=1[introsource];
      [introsource][${outroIndex}:a]acrossfade=d=1[a]`;
    else
      fc += `
      [${audioIndex}:a]
        atrim=
          end=${contentDuration},
        afade=in:st=0:d=1[sourcetrimmed];
      [sourcetrimmed][${outroIndex}:a]acrossfade=d=1[a]`;
  } else if (intro.path) {
    fc += `
    [intro][crossfade][source]concat=n=3[v];`;

    if (!silentIntro)
      fc += `
      [${audioIndex}:a]
        afade=t=out:st=${contentDuration - 2}:d=2,
        atrim=
          end=${contentDuration}[sourcetrimmed];
      [${introIndex}:a][sourcetrimmed]acrossfade=d=1[a]`;
    else
      fc += `
      [${audioIndex}:a]
        afade=t=out:st=${contentDuration - 2}:d=2,
        atrim=
          end=${contentDuration},
        afade=in:st=0:d=1[a]`;
  } else if (outro.path) {
    fc += `
    [source][crossfade2][outro]concat=n=3[v];

    [${audioIndex}:a]
    atrim=
      end=${contentDuration},
    afade=in:st=0:d=1[sourcetrimmed];
    [sourcetrimmed][${outroIndex}:a]acrossfade=d=1[a]`;
  } else {
    fc += `
    [source]split=1[v];

    [${audioIndex}:a]
        afade=t=out:st=${contentDuration - 2}:d=2,
        atrim=
        end=${contentDuration},
      afade=in:st=0:d=1[a]`;
  }

  console.log(fc);

  // return [];

  result.push(
    "-filter_complex",
    fc.replace(/[\n\ ]/gm, ""),
    "-map",
    "[v]",
    "-map",
    "[a]",
    streams.output.path
  );

  return result;
}
