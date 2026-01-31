'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';
import ServerSidebar from '@/components/servers/ServerSidebar';
import ChannelSidebar from '@/components/channels/ChannelSidebar';
import UserPanel from '@/components/users/UserPanel';

export default function VoiceChannelPage() {
  const params = useParams();
  const serverId = params?.serverId as string;
  const channelId = params?.channelId as string;
  const [micEnabled, setMicEnabled] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const supabase = createClient();

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleJoin = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      setMicEnabled(true);
      setIsConnected(true);
    } catch (error) {
      console.error('Error accessing media devices:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const handleLeave = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    setMicEnabled(false);
    setVideoEnabled(false);
    setIsConnected(false);
  };

  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !micEnabled;
      });
      setMicEnabled(!micEnabled);
    }
  };

  const toggleVideo = async () => {
    if (!videoEnabled && localStreamRef.current) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        const videoTracks = stream.getVideoTracks();
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setVideoEnabled(true);
      } catch (error) {
        console.error('Error accessing camera:', error);
      }
    } else if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      videoTracks.forEach(track => track.stop());
      setVideoEnabled(false);
    }
  };

  return (
    <div className="flex h-screen w-full">
      <ServerSidebar />
      <ChannelSidebar />
      <div className="flex-1 flex flex-col bg-gray-900">
        <div className="h-12 border-b border-gray-700 px-4 flex items-center shadow-sm">
          <h1 className="font-semibold text-white">Voice Channel</h1>
        </div>

        <div className="flex-1 flex items-center justify-center p-8">
          {!isConnected ? (
            <div className="text-center">
              <p className="text-gray-400 mb-4">You are not connected to this voice channel</p>
              <button
                onClick={handleJoin}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                Join Voice Channel
              </button>
            </div>
          ) : (
            <div className="w-full max-w-4xl space-y-4">
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-white font-semibold">You</h2>
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        micEnabled ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    />
                    <span className="text-sm text-gray-400">
                      {micEnabled ? 'Mic On' : 'Mic Off'}
                    </span>
                  </div>
                </div>
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  className="w-full rounded-lg bg-gray-900"
                  style={{ maxHeight: '400px' }}
                />
              </div>

              <div className="flex justify-center space-x-4">
                <button
                  onClick={toggleMic}
                  className={`p-4 rounded-full ${
                    micEnabled
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                  title={micEnabled ? 'Mute' : 'Unmute'}
                >
                  {micEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                </button>
                <button
                  onClick={toggleVideo}
                  className={`p-4 rounded-full ${
                    videoEnabled
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-white'
                  }`}
                  title={videoEnabled ? 'Turn off camera' : 'Turn on camera'}
                >
                  {videoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                </button>
                <button
                  onClick={handleLeave}
                  className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white"
                  title="Leave"
                >
                  <PhoneOff className="w-6 h-6" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <UserPanel />
    </div>
  );
}
