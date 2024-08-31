"use client";
import LeftSidebar from "@/components/meetingComponents/LeftSidebar";
import MeetingView from "@/components/meetingComponents/MeetingView";
import RightSidebar from "@/components/meetingComponents/RightSidebar";
import React, { useEffect, useState } from "react";
import userImage from "../../../../public/user.jpg";
import { useParams, useSearchParams } from "next/navigation";
import io from "socket.io-client";
import { useGlobalContext } from "@/context/GlobalContext";

const Page = () => {
  const [users, setUsers] = useState([]);
  const { user } = useGlobalContext();
  const [observers, setObservers] = useState([]);
  const moderatorFullName = `${user?.firstName} ${user?.lastName}`;
  const searchParams = useSearchParams();
  const fullName = searchParams.get("fullName");
  const userRole = searchParams.get("role");
  const [role, setRole] = useState("");
  const params = useParams();
  const [isMeetingOngoing, setIsMeetingOngoing] = useState(false);
  const [waitingRoom, setWaitingRoom] = useState([]);
  const [isAdmitted, setIsAdmitted] = useState(false);
  const [socket, setSocket] = useState(null);
  const projectStatus = "Open";
  const [isWhiteBoardOpen, setIsWhiteBoardOpen] = useState(false);
  const [isRecordingOpen, setIsRecordingOpen] = useState(false);
  const [isBreakoutRoom, setIsBreakoutRoom] = useState(false);
  const [breakoutRooms, setBreakoutRooms] = useState([
    // ... (breakout rooms data)
  ]);
  const [selectedRoom, setSelectedRoom] = useState(breakoutRooms[0]);
  const [peers, setPeers] = useState([]);
  const [streams, setStreams] = useState([]);
  const [messages, setMessages] = useState([]);
  const [peerData, setPeerData] = useState({});
  const handleBreakoutRoomChange = (roomName) => {
    const room = breakoutRooms.find((room) => room.roomName === roomName);
    setSelectedRoom(room);
  };

  useEffect(() => {
    const newSocket = io("http://localhost:8008/participant-namespace");
    setSocket(newSocket);

    newSocket.on("meetingStarted", (waitingList) => {
      setWaitingRoom(waitingList);
      setIsMeetingOngoing(true);
    });

    newSocket.on("newParticipantWaiting", (participant) => {
      setWaitingRoom((prev) => [...prev, participant]);
    });

    newSocket.on("participantAdmitted", (participant, isMeetingStarted) => {
      setWaitingRoom((prev) =>
        prev.filter((p) => p.socketId !== participant.socketId)
      );
      if (role === "Participant" && participant.socketId === newSocket.id) {
        setIsAdmitted(true);
        setIsMeetingOngoing(isMeetingStarted);
      }
      addToPeersOrStreams(participant);
    });

    newSocket.on("userJoined", (user) => {
      addToPeersOrStreams(user);
    });

    newSocket.on("participantLeft", (socketId) => {
      setPeers((prev) => prev.filter((p) => p.socketId !== socketId));
      setStreams((prev) => prev.filter((s) => s.socketId !== socketId));
    });

    newSocket.on("activeParticipantsUpdated", (participants) => {
      setPeers(participants);
    });

    newSocket.on("newMessage", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    newSocket.on("chatHistory", (chatHistory) => {
      setMessages(chatHistory);
    });

    if (fullName && userRole) {
      newSocket.emit("joinMeeting", {
        name: fullName,
        role: userRole,
        meetingId: params.id,
      });
    }

    return () => {
      newSocket.disconnect();
    };
  }, [fullName, userRole, role, params.id]);

  useEffect(() => {
    if (socket && params.id) {
      socket.emit("getChatHistory", params.id);
    }
  }, [socket, params.id]);

  useEffect(() => {
    if (fullName && userRole) {
      setRole(userRole);
    }
  }, [fullName, userRole]);

  const acceptParticipant = (participant) => {
    socket.emit("admitParticipant", participant.socketId);
    setPeerData(participant.name);
  };

  const addToPeersOrStreams = (participant) => {
    if (
      participant.role === "Participant" ||
      participant.role === "Moderator"
    ) {
      setPeers((prev) => [...prev, participant]);
    }
    if (participant.role === "Moderator" || participant.role === "Observer") {
      setStreams((prev) => [...prev, participant]);
    }
  };

  const startMeeting = () => {
    socket.emit("startMeeting", { meetingId: params.id });
  };

  const sendMessage = (messageData) => {
    socket.emit("sendMessage", messageData);
  };
  // useEffect(() => {
  //   socket.on("newMessage", (message) => {
  //     setMessages(prevMessages => [...prevMessages, message]);
  //   });

  //   return () => {
  //     socket.off("newMessage");
  //   };
  // }, [socket]);
  return (
    <>
      <div className="flex justify-between min-h-screen max-h-screen meeting_bg">
        {role === "Participant" && !isAdmitted ? (
          <div className="flex items-center justify-center w-full min-h-screen bg-white ">
            <h1 className="text-2xl font-bold">
              Please wait, the meeting host will let you in soon.
            </h1>
          </div>
        ) : role === "Participant" && isAdmitted ? (
          <>
            <div className="h-full">
              <LeftSidebar
                users={peers}
                setUsers={setUsers}
                role={role}
                isWhiteBoardOpen={isWhiteBoardOpen}
                setIsWhiteBoardOpen={setIsWhiteBoardOpen}
                isRecordingOpen={isRecordingOpen}
                setIsRecordingOpen={setIsRecordingOpen}
                isBreakoutRoom={isBreakoutRoom}
                setIsBreakoutRoom={setIsBreakoutRoom}
                breakoutRooms={breakoutRooms}
                setBreakoutRooms={setBreakoutRooms}
                handleBreakoutRoomChange={handleBreakoutRoomChange}
                selectedRoom={selectedRoom}
                setSelectedRoom={setSelectedRoom}
                messages={messages}
                sendMessage={sendMessage}
                userName={fullName}
                meetingId={params.id}
                socket={socket}
                setMessages={setMessages}
              />
            </div>
            <div className="flex-1 w-full max-h-[100vh] overflow-hidden">
              <MeetingView
              peerData={peerData}
                role={role}
                users={peers}
                isWhiteBoardOpen={isWhiteBoardOpen}
                setIsWhiteBoardOpen={setIsWhiteBoardOpen}
                meetingStatus={isMeetingOngoing}
                isRecordingOpen={isRecordingOpen}
                setIsRecordingOpen={setIsRecordingOpen}
                isBreakoutRoom={isBreakoutRoom}
                setIsBreakoutRoom={setIsBreakoutRoom}
                breakoutRooms={breakoutRooms}
                setBreakoutRooms={setBreakoutRooms}
                projectStatus={projectStatus}
              />
            </div>
          </>
        ) : role === "Moderator" && !isMeetingOngoing ? (
          <div className="flex items-center justify-center w-full h-full">
            <button
              className="px-4 py-2 font-bold text-white bg-blue-500 rounded"
              onClick={startMeeting}
            >
              Start Meeting
            </button>
          </div>
        ) : role === "Moderator" && isMeetingOngoing ? (
          <>
            <div className="h-full">
              <LeftSidebar
              peerData={peerData}
                socket={socket}
                users={peers}
                setUsers={setUsers}
                role={role}
                isWhiteBoardOpen={isWhiteBoardOpen}
                setIsWhiteBoardOpen={setIsWhiteBoardOpen}
                isRecordingOpen={isRecordingOpen}
                setIsRecordingOpen={setIsRecordingOpen}
                isBreakoutRoom={isBreakoutRoom}
                setIsBreakoutRoom={setIsBreakoutRoom}
                breakoutRooms={breakoutRooms}
                setBreakoutRooms={setBreakoutRooms}
                handleBreakoutRoomChange={handleBreakoutRoomChange}
                selectedRoom={selectedRoom}
                setSelectedRoom={setSelectedRoom}
                waitingRoom={waitingRoom}
                acceptParticipant={acceptParticipant}
                messages={messages}
                sendMessage={sendMessage}
                userName={moderatorFullName}
                meetingId={params.id}
                setMessages={setMessages}
              />
            </div>
            <div className="flex-1 w-full max-h-[100vh] overflow-hidden">
              <MeetingView
                            peerData={peerData}

                role={role}
                users={peers}
                isWhiteBoardOpen={isWhiteBoardOpen}
                setIsWhiteBoardOpen={setIsWhiteBoardOpen}
                meetingStatus={isMeetingOngoing}
                isRecordingOpen={isRecordingOpen}
                setIsRecordingOpen={setIsRecordingOpen}
                isBreakoutRoom={isBreakoutRoom}
                setIsBreakoutRoom={setIsBreakoutRoom}
                breakoutRooms={breakoutRooms}
                setBreakoutRooms={setBreakoutRooms}
                projectStatus={projectStatus}
              />
            </div>
            <div className="h-full">
              <RightSidebar
                socket={socket}
                setMessages={setMessages}
                users={peers}
                setUsers={setUsers}
                role={role}
                isWhiteBoardOpen={isWhiteBoardOpen}
                setIsWhiteBoardOpen={setIsWhiteBoardOpen}
                isRecordingOpen={isRecordingOpen}
                setIsRecordingOpen={setIsRecordingOpen}
                isBreakoutRoom={isBreakoutRoom}
                setIsBreakoutRoom={setIsBreakoutRoom}
                breakoutRooms={breakoutRooms}
                setBreakoutRooms={setBreakoutRooms}
                handleBreakoutRoomChange={handleBreakoutRoomChange}
                selectedRoom={selectedRoom}
                setSelectedRoom={setSelectedRoom}
                waitingRoom={waitingRoom}
                acceptParticipant={acceptParticipant}
                messages={messages}
                sendMessage={sendMessage}
                userName={moderatorFullName}
                meetingId={params.id}
              />
            </div>
          </>
        ) : role === "Observer" ? (
          <>
            <MeetingView
              role={role}
              peerData={peerData}

              users={peers}
              isWhiteBoardOpen={isWhiteBoardOpen}
              setIsWhiteBoardOpen={setIsWhiteBoardOpen}
              meetingStatus={true}
              isRecordingOpen={isRecordingOpen}
              setIsRecordingOpen={setIsRecordingOpen}
              isBreakoutRoom={isBreakoutRoom}
              setIsBreakoutRoom={setIsBreakoutRoom}
              breakoutRooms={breakoutRooms}
              setBreakoutRooms={setBreakoutRooms}
              projectStatus={projectStatus}
            />
            <RightSidebar
              socket={socket}
              setMessages={setMessages}
              users={peers}
              setUsers={setUsers}
              role={role}
              isWhiteBoardOpen={isWhiteBoardOpen}
              setIsWhiteBoardOpen={setIsWhiteBoardOpen}
              isRecordingOpen={isRecordingOpen}
              setIsRecordingOpen={setIsRecordingOpen}
              isBreakoutRoom={isBreakoutRoom}
              setIsBreakoutRoom={setIsBreakoutRoom}
              breakoutRooms={breakoutRooms}
              setBreakoutRooms={setBreakoutRooms}
              handleBreakoutRoomChange={handleBreakoutRoomChange}
              selectedRoom={selectedRoom}
              setSelectedRoom={setSelectedRoom}
              waitingRoom={waitingRoom}
              acceptParticipant={acceptParticipant}
              messages={messages}
              sendMessage={sendMessage}
              userName={moderatorFullName}
              meetingId={params.id}
            />
            {/* <div className="h-full">
            <LeftSidebar
                users={peers}
                setUsers={setUsers}
                role={role}
                isWhiteBoardOpen={isWhiteBoardOpen}
                setIsWhiteBoardOpen={setIsWhiteBoardOpen}
                isRecordingOpen={isRecordingOpen}
                setIsRecordingOpen={setIsRecordingOpen}
                isBreakoutRoom={isBreakoutRoom}
                setIsBreakoutRoom={setIsBreakoutRoom}
                breakoutRooms={breakoutRooms}
                setBreakoutRooms={setBreakoutRooms}
                handleBreakoutRoomChange={handleBreakoutRoomChange}
                selectedRoom={selectedRoom}
                setSelectedRoom={setSelectedRoom}
                messages={messages}
                sendMessage={sendMessage}
                userName={fullName}
                meetingId={params.id}
                socket={socket}
                setMessages={setMessages}
              />
            </div>
            <div className="flex-1 w-full max-h-[100vh] overflow-hidden">
              <MeetingView
                role={role}
                users={users}
                isWhiteBoardOpen={isWhiteBoardOpen}
                setIsWhiteBoardOpen={setIsWhiteBoardOpen}
                meetingStatus={isMeetingOngoing}
                isRecordingOpen={isRecordingOpen}
                setIsRecordingOpen={setIsRecordingOpen}
                isBreakoutRoom={isBreakoutRoom}
                setIsBreakoutRoom={setIsBreakoutRoom}
                breakoutRooms={breakoutRooms}
                setBreakoutRooms={setBreakoutRooms}
                projectStatus={projectStatus}
              />
            </div>
            <div className="h-full">
              <RightSidebar
                socket={socket}
                setMessages={setMessages}
                users={users}
                setUsers={setUsers}
                role={role}
                isWhiteBoardOpen={isWhiteBoardOpen}
                setIsWhiteBoardOpen={setIsWhiteBoardOpen}
                isRecordingOpen={isRecordingOpen}
                setIsRecordingOpen={setIsRecordingOpen}
                isBreakoutRoom={isBreakoutRoom}
                setIsBreakoutRoom={setIsBreakoutRoom}
                breakoutRooms={breakoutRooms}
                setBreakoutRooms={setBreakoutRooms}
                handleBreakoutRoomChange={handleBreakoutRoomChange}
                selectedRoom={selectedRoom}
                setSelectedRoom={setSelectedRoom}
                messages={messages}
                sendMessage={sendMessage}
                userName={fullName}
                meetingId={params.id}
              />
            </div> */}
          </>
        ) : (
          <div className="flex items-center justify-center w-full min-h-screen bg-white ">
            <h1 className="text-2xl font-bold">
              Please wait, the meeting host will let you in soon.
            </h1>
          </div>
        )}
      </div>
    </>
  );
};

export default Page;
