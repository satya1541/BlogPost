import { useState, useRef, useEffect } from "react";
import { Play, Pause, Clock, Volume2, VolumeX, Radio } from "lucide-react";

interface Episode {
  id: number;
  title: string;
  description: string;
  duration: string;
  publishDate: string;
  audioUrl: string;
}

const EPISODES: Episode[] = [
  {
    id: 1,
    title: "Building in Public: The Zero-to-One Manual",
    description: "In this episode, we unpack why building in public is the ultimate unfair advantage for modern founders. Learn how to share vulnerabilities, handle copycats, and bootstrap distribution.",
    duration: "42:15",
    publishDate: "July 12, 2026",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  },
  {
    id: 2,
    title: "The Solopreneur Stack for 2026",
    description: "An exhaustive breakdown of the low-code, high-leverage software stack enabling single founders to scale past $1M ARR. AI tools, cloud database providers, and automated pipeline scripts.",
    duration: "34:40",
    publishDate: "July 05, 2026",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  },
  {
    id: 3,
    title: "Mindset & Metacognition in Startup Failure",
    description: "A deep philosophical look at the psychological tolls of start-up failures, reframing defeat as a pivot, and maintaining mental resilience under immense venture capital pressure.",
    duration: "51:10",
    publishDate: "June 28, 2026",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  }
];

export default function Podcasts() {
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const handlePlayEpisode = (episode: Episode) => {
    if (currentEpisode?.id === episode.id) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play().catch(e => console.warn('Play interrupted:', e));
        setIsPlaying(true);
      }
    } else {
      setCurrentEpisode(episode);
      setIsPlaying(true);
      // Wait for element to mount/update source
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.load();
          audioRef.current.play().catch(e => console.warn('Play interrupted:', e));
        }
      }, 50);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleProgressBarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = value;
      setCurrentTime(value);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 max-w-5xl animate-in fade-in duration-700">
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 rounded-full text-accent text-xs font-semibold uppercase tracking-widest mb-4">
          <Radio className="w-3.5 h-3.5" /> Podcasts
        </div>
        <h1 className="font-serif text-4xl md:text-5xl font-light mb-4">
          The Panda Nomad <span className="italic text-accent">Audio Experience</span>
        </h1>
        <p className="mt-4 text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Tune into deep discussions with startup operators, software engineers, and philosophers on scaling projects and building in public.
        </p>
      </div>

      {/* Episodes List */}
      <div className="grid grid-cols-1 gap-6 mb-12">
        {EPISODES.map((ep) => {
          const isCurrent = currentEpisode?.id === ep.id;
          return (
            <div
              key={ep.id}
              className={`border p-6 bg-background rounded-sm flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all ${
                isCurrent ? "border-accent shadow-lg shadow-accent/5 ring-1 ring-accent/20" : "border-border/60 hover:border-primary/40"
              }`}
            >
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="font-medium">{ep.publishDate}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {ep.duration}
                  </span>
                </div>
                <h3 className="font-serif text-xl font-medium text-foreground">{ep.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{ep.description}</p>
              </div>

              <button
                onClick={() => handlePlayEpisode(ep)}
                className={`flex items-center gap-2 justify-center px-6 py-3 font-semibold text-sm rounded-sm transition-all shrink-0 ${
                  isCurrent && isPlaying
                    ? "bg-accent text-white hover:bg-accent/90"
                    : "bg-primary text-primary-foreground hover:bg-accent hover:text-white"
                }`}
              >
                {isCurrent && isPlaying ? (
                  <>
                    <Pause className="w-4 h-4" /> Pause Episode
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" /> Listen Now
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Hidden Audio Element */}
      {currentEpisode && (
        <audio
          ref={audioRef}
          src={currentEpisode.audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleAudioEnded}
        />
      )}

      {/* Audio Player Control Bar */}
      {currentEpisode && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 border-t border-border backdrop-blur-md py-4 shadow-xl">
          <div className="container mx-auto px-4 max-w-5xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-left w-full md:w-1/3">
              <div className="w-10 h-10 bg-accent/15 rounded-sm flex items-center justify-center text-accent shrink-0">
                <Radio className="w-5 h-5" />
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-accent uppercase tracking-wider mb-0.5">Now Playing</p>
                <p className="text-sm font-medium text-foreground truncate">{currentEpisode.title}</p>
              </div>
            </div>

            {/* Playback Controls & Progress Bar */}
            <div className="flex flex-col items-center gap-2 w-full md:w-1/2">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handlePlayEpisode(currentEpisode)}
                  className="p-3 bg-primary text-primary-foreground rounded-full hover:bg-accent hover:text-white transition-colors"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
                </button>
              </div>
              <div className="flex items-center gap-3 w-full text-xs font-mono text-muted-foreground">
                <span>{formatTime(currentTime)}</span>
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleProgressBarChange}
                  className="flex-1 accent-accent h-1 bg-muted rounded-lg appearance-none cursor-pointer"
                />
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Volume controls */}
            <div className="flex items-center gap-3 w-full md:w-1/4 justify-end">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => {
                  setVolume(parseFloat(e.target.value));
                  setIsMuted(false);
                }}
                className="w-20 accent-accent h-1 bg-muted rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
