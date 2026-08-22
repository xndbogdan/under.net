import type {
  CSSProperties, HTMLProps
} from 'react';
import {
  useRef, useEffect, useCallback,
} from 'react';

type MeterColor = {
  stop: number,
  color: CSSProperties['color'],
};

export type AudioSpectrumProps = {
  id: string,
  width: number,
  height: number,
  audioId?: string,
  audioEle?: HTMLAudioElement,
  capColor: CSSProperties['color'],
  capHeight: number,
  meterWidth: number,
  meterCount: number,
  meterColor: string | MeterColor[],
  gap: number,
} & HTMLProps<HTMLCanvasElement>;

type PlayStatus = 'PAUSED' | 'PLAYING';

const defaultProps = {
  width: 300,
  height: 200,
  capColor: '#FFF',
  capHeight: 2,
  meterWidth: 2,
  meterCount: 40 * (2 + 2),
  meterColor: [
    { stop: 0, color: '#f00' },
    { stop: 0.5, color: '#0CD7FD' },
    { stop: 1, color: 'red' },
  ],
  gap: 10, // gap between meters
};

function getRandomId(len: number) {
  const str = '1234567890-qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM';

  return Array.from({ length: len })
    .reduce((acc: string) => acc.concat(
      str[Math.floor((Math.random() * str.length))],
    ), '');
}

export default function AudioSpectrum({
  width = defaultProps.width,
  height = defaultProps.height,
  capColor = defaultProps.capColor,
  capHeight = defaultProps.capHeight,
  meterWidth = defaultProps.meterWidth,
  meterCount = defaultProps.meterCount,
  meterColor = defaultProps.meterColor,
  gap = defaultProps.gap,
  id = getRandomId(50),
  audioEle: propsAudioEl,
  audioId,
  ...restProps
}: AudioSpectrumProps) {
  const animationId = useRef<number | null>(null);
  const canvasId = id;
  const audioContext = useRef<AudioContext | null>(null);
  const audioCanvas = useRef<HTMLCanvasElement | null>(null);
  const playStatus = useRef<PlayStatus | null>(null);
  const mediaEleSource = useRef<MediaElementAudioSourceNode | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);
  const audioEle = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const prepareElements = useCallback(() => {
    if (!audioId && !propsAudioEl) {
      console.error('target audio not found!');
      return;
    }
    if (audioId) {
      audioEle.current = document.getElementById(audioId) as HTMLAudioElement;
    } else if (propsAudioEl) {
      audioEle.current = propsAudioEl;
    }
    audioCanvas.current = canvasRef.current;
  }, [audioId, propsAudioEl]);

  const drawSpectrum = useCallback((currentAnalyser: AnalyserNode) => {
    const cWidth = audioCanvas.current!.width;
    const cHeight = audioCanvas.current!.height - capHeight;
    // store the vertical position of the caps for the previous frame
    const capYPositionArray: number[] = [];
    const decayBlocksArray: number[] = [];
    const ctx = audioCanvas.current!.getContext('2d')!;
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);

    if (Array.isArray(meterColor)) {
      const stops = meterColor;
      stops.forEach((stop) => {
        gradient.addColorStop(stop.stop, stop.color as string);
      });
    } else if (typeof meterColor === 'string') {
      // gradient = this.props.meterColor
    }

    const primaryThemeColor =
      Array.isArray(meterColor) && meterColor.length > 0
        ? (meterColor[0].color as string)
        : typeof meterColor === 'string'
          ? meterColor
          : '#ea5a0c';

    const numBlocks = 6;
    const blockGap = 1.5;
    const blockHeight = Math.max(2, Math.floor((cHeight - (numBlocks - 1) * blockGap) / numBlocks));
    const totalBarsWidth = meterCount * (meterWidth + gap) - gap;
    const startX = Math.max(0, Math.floor((cWidth - totalBarsWidth) / 2));

    const drawMeter = () => {
      // item value of array: 0 - 255
      const array = new Uint8Array(currentAnalyser.frequencyBinCount);
      currentAnalyser.getByteFrequencyData(array);
      if (playStatus.current === 'PAUSED') {
        array.fill(0);
        const allCapsReachBottom = !capYPositionArray.some((cap) => cap > 0);
        if (allCapsReachBottom) {
          ctx.clearRect(0, 0, cWidth, cHeight + capHeight);
          cancelAnimationFrame(animationId.current!);
          return;
        }
      }

      // sample limited data from the total array
      const step = Math.max(1, Math.floor(array.length / (meterCount * 2)));
      ctx.clearRect(0, 0, cWidth, cHeight + capHeight);

      for (let i = 0; i < meterCount; i++) {
        const value = array[i * step] || 0;
        const colX = startX + i * (meterWidth + gap);

        // Peak cap tracking
        if (capYPositionArray.length < meterCount) {
          capYPositionArray.push(value);
          decayBlocksArray.push(0);
        }
        if (value < capYPositionArray[i]) {
          capYPositionArray[i] = Math.max(0, capYPositionArray[i] - 2.5);
        } else {
          capYPositionArray[i] = value;
        }

        const activeBlocks = Math.round((value / 255) * numBlocks);

        // Liquid crystal decay trail tracking
        if (activeBlocks >= decayBlocksArray[i]) {
          decayBlocksArray[i] = activeBlocks;
        } else {
          decayBlocksArray[i] = Math.max(activeBlocks, decayBlocksArray[i] - 0.2);
        }
        const decayIntBlock = Math.ceil(decayBlocksArray[i]);

        // draw permanent unlit background segment cells (25% opacity in exact theme color)
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = primaryThemeColor;
        for (let b = 0; b < numBlocks; b++) {
          const blockY = cHeight - (b + 1) * (blockHeight + blockGap);
          ctx.fillRect(colX, blockY, meterWidth, blockHeight);
        }

        // draw decaying ghost trail in theme color
        if (decayIntBlock > activeBlocks) {
          ctx.globalAlpha = 0.55;
          ctx.fillStyle = primaryThemeColor;
          for (let b = activeBlocks; b < decayIntBlock; b++) {
            const blockY = cHeight - (b + 1) * (blockHeight + blockGap);
            ctx.fillRect(colX, blockY, meterWidth, blockHeight);
          }
        }

        // draw active lit segment blocks with matching phosphor bloom
        ctx.globalAlpha = 1.0;
        ctx.shadowColor = primaryThemeColor;
        ctx.shadowBlur = 2.5;
        ctx.fillStyle = primaryThemeColor;
        for (let b = 0; b < activeBlocks; b++) {
          const blockY = cHeight - (b + 1) * (blockHeight + blockGap);
          ctx.fillRect(colX, blockY, meterWidth, blockHeight);
        }

        // draw peak cap block
        const peakBlock = Math.min(numBlocks - 1, Math.round((capYPositionArray[i] / 255) * numBlocks));
        if (peakBlock >= activeBlocks && peakBlock > 0) {
          ctx.globalAlpha = 1.0;
          ctx.shadowBlur = 2.5;
          ctx.shadowColor = primaryThemeColor;
          ctx.fillStyle = (capColor as string) || primaryThemeColor;
          const peakY = cHeight - (peakBlock + 1) * (blockHeight + blockGap);
          ctx.fillRect(colX, peakY, meterWidth, blockHeight);
        }
        ctx.globalAlpha = 1.0;
      }
      animationId.current = requestAnimationFrame(drawMeter);
    };
    if (animationId.current) {
      cancelAnimationFrame(animationId.current);
    }
    animationId.current = requestAnimationFrame(drawMeter);
  }, [capColor, capHeight, gap, meterColor, meterCount, meterWidth]);

  // create analyser and connect media source
  const setupAudioNode = useCallback((currentAudioEle: HTMLAudioElement) => {
    if (!currentAudioEle) {
      throw new Error('Audio element is not found');
    }
    if (!analyser.current && audioContext.current) {
      analyser.current = audioContext.current.createAnalyser();
      analyser.current.smoothingTimeConstant = 0.8;
      analyser.current.fftSize = 2048;
    }

    if (!mediaEleSource.current && audioContext.current && analyser.current) {
      try {
        mediaEleSource.current = audioContext.current.createMediaElementSource(currentAudioEle);
        mediaEleSource.current.connect(analyser.current);
        mediaEleSource.current.connect(audioContext.current.destination);
      } catch (err) {
        console.warn('Media element already connected or could not connect:', err);
      }
    }

    return analyser;
  }, []);

  // create or update audioContext
  const prepareAPIs = useCallback(() => {
    try {
      if (!audioContext.current || audioContext.current.state === 'closed') {
        audioContext.current = new window.AudioContext();
      } else if (audioContext.current.state === 'suspended') {
        audioContext.current.resume();
      }
    } catch (e) {
      console.error('!Your browser does not support AudioContext', e);
    }
  }, []);

  const initAudioEvents = useCallback(() => {
    if (audioEle.current) {
      audioEle.current.onpause = () => {
        playStatus.current = 'PAUSED';
      };
      audioEle.current.onplay = () => {
        playStatus.current = 'PLAYING';
        prepareAPIs();
        const currentAnalyser = setupAudioNode(audioEle.current!);
        drawSpectrum(currentAnalyser.current!);
      };
    }
  }, [drawSpectrum, prepareAPIs, setupAudioNode]);

  useEffect(() => {
    prepareElements();
    initAudioEvents();

    return () => {
      if (animationId.current) {
        cancelAnimationFrame(animationId.current);
      }
    };
  }, [prepareElements, initAudioEvents]);

  return (
    <canvas
      ref={canvasRef}
      id={canvasId}
      width={width}
      height={height}
      {...restProps}
    />
  );
}