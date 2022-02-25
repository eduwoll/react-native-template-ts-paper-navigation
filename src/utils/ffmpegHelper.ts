import { Streams } from "../components/create-video-steps/RenderVideo";

export function getRenderCommands(
  streams: Streams,
  sourceStartTime: number,
  sourceEndTime: number,
  silentIntro: boolean
): string[] {
  const { intro, source, outro, sourceAudio } = streams;

  if (!source) return [];

  const result: string[] = [];

  var introIndex = 0,
    sourceIndex = 0,
    outroIndex = 0,
    audioIndex = 0;
  var currentIndex = 0;

  var fc = "";

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

  result.push("-i", source.path);
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
    fc += `,split=3[source1][source2][source_body];`;
  else if (intro.path) fc += `,split=2[source1][source_body];`;
  else if (outro.path) fc += `,split=2[source2][source_body];`;
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

  if (typeof source !== "string" && sourceAudio) {
    result.push("-i", sourceAudio.path);
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
      fc += `[source1]
    trim=
      start=${sourceStartTime}:
      end=${sourceStartTime + 1},
      setpts=PTS-STARTPTS[sourcefadein];
  [source_body]
    trim=
      start=${sourceStartTime + 1}:
      end=${outro.path ? sourceEndTime - 1 : sourceEndTime},
    setpts=PTS-STARTPTS[source];`;
    else {
      fc += `[source1]
        trim=
          start=${sourceStartTime + intro.duration}:
          end=${sourceStartTime + intro.duration + 1},
          setpts=PTS-STARTPTS[sourcefadein];
      [source_body]
        trim=
          start=${sourceStartTime + intro.duration + 1}:
          end=${outro.path ? sourceEndTime - 1 : sourceEndTime},
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
      trim=
        start=${sourceStartTime}:
        end=${outro.path ? sourceEndTime - 1 : sourceEndTime},
        setpts=PTS-STARTPTS[source]; `;
  }

  if (outro.path) {
    fc += `
    [source2]
      trim=
        start=${sourceEndTime - 1}:
        end=${sourceEndTime},
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
          start=${sourceStartTime}:
          end=${sourceEndTime}[sourcetrimmed];
      [${introIndex}:a][sourcetrimmed]acrossfade=d=1[introsource];
      [introsource][${outroIndex}:a]acrossfade=d=1[a]`;
    else
      fc += `
      [${audioIndex}:a]
        atrim=
          start=${sourceStartTime}:
          end=${sourceEndTime}[sourcetrimmed];
      [sourcetrimmed][${outroIndex}:a]acrossfade=d=1[a]`;
  } else if (intro.path) {
    fc += `
    [intro][crossfade][source]concat=n=3[v];`;

    if (!silentIntro)
      fc += `
      [${audioIndex}:a]
        atrim=
          start=${sourceStartTime}:
          end=${sourceEndTime}[sourcetrimmed];
      [${introIndex}:a][sourcetrimmed]acrossfade=d=1[a]`
    else
      fc += `
      [${audioIndex}:a]
      atrim=
        start=${sourceStartTime}:
        end=${sourceEndTime},
      afade=in:st=0:d=1[a]`;
    
  } else if (outro.path) {
    fc += `
    [source][crossfade2][outro]concat=n=3[v];

    [${audioIndex}:a]
      atrim=
        start=${sourceStartTime}:
        end=${sourceEndTime}[sourcetrimmed];
    [sourcetrimmed][${outroIndex}:a]acrossfade=d=1[a]`;
  } else {
    fc += `
    [source]split=1[v];

    [${audioIndex}:a]
      atrim=
        start=${sourceStartTime}:
        end=${sourceEndTime},
      afade=in:st=0:d=1[a]`;
  }

  console.log(fc);

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
