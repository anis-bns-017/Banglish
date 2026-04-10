import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

const UseAudio = () => {
  const [isMuted, setIsMuted] = useState(true);
  const [isDeafened, setIsDeafened] = useState(false);
  const [volume, setVolume] = useState(80);
  const [audioDevices, setAudioDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('default');
  const [isAudioReady, setIsAudioReady] = useState(false);
  
  const localStreamRef = useRef(null);
  const audioContextRef = useRef(null);

  // Initialize audio on mount
  useEffect(() => {
    initAudio();
    enumerateDevices();

    return () => {
      // Cleanup
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const initAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      localStreamRef.current = stream;
      
      // Mute by default
      stream.getAudioTracks().forEach(track => {
        track.enabled = false;
      });

      // Create audio context for potential future use
      audioContextRef.current = new AudioContext();
      
      setIsAudioReady(true);
      console.log('Audio initialized successfully');
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      toast.error('Please allow microphone access to join voice chat');
    }
  };

  const enumerateDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(device => device.kind === 'audioinput');
      setAudioDevices(audioInputs);
      
      if (audioInputs.length > 0) {
        setSelectedDevice(audioInputs[0].deviceId);
      }
    } catch (error) {
      console.error('Failed to enumerate audio devices:', error);
    }
  };

  const changeDevice = async (deviceId) => {
    try {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: deviceId } }
      });
      
      localStreamRef.current = stream;
      
      // Maintain mute state
      stream.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
      });
      
      setSelectedDevice(deviceId);
      toast.success('Microphone changed');
    } catch (error) {
      console.error('Failed to change audio device:', error);
      toast.error('Failed to switch microphone');
    }
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const newMuted = !isMuted;
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !newMuted;
      });
      setIsMuted(newMuted);
    }
  };

  const toggleDeafen = () => {
    setIsDeafened(!isDeafened);
  };

  return {
    isMuted,
    setIsMuted,
    isDeafened,
    setIsDeafened,
    volume,
    setVolume,
    audioDevices,
    selectedDevice,
    changeDevice,
    toggleMute,
    toggleDeafen,
    localStream: localStreamRef.current,
    isAudioReady
  };
};

export default UseAudio;