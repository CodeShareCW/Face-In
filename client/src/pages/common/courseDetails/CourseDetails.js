import { RedoOutlined } from "@ant-design/icons";
import { useMutation, useQuery } from "@apollo/react-hooks";
import {
  Avatar,
  Button,
  Card,
  Divider,
  Layout,
  message,
  Space,
  Table,
  Tag,
} from "antd";
import React, { useContext, useEffect, useState } from "react";
import Modal from "../../../components/common/customModal";
import {
  Footer,
  Greeting,
  Navbar,
  PageTitleBreadcrumb,
} from "../../../components/common/sharedLayout";
import { AuthContext } from "../../../context";
import { CheckError, ErrorComp } from "../../../ErrorHandling";
import { modalItems } from "../../../globalData";
import {
  KICK_PARTICIPANT_MUTATION,
  WARN_PARTICIPANT_MUTATION,
} from "../../../graphql/mutation";
import { FETCH_COURSE_QUERY } from "../../../graphql/query";
import CourseDetailCard from "./CourseDetailCard";
import "./CourseDetails.css";
const { Content } = Layout;

export default (props) => {
  const columns = [
    {
      title: <strong>Avatar</strong>,
      dataIndex: "profilePictureURL",
      key: "profilePictureURL",
      render: (imgURL, record) => (
        <Avatar
          src={imgURL}
          size={50}
          style={{
            backgroundColor: `rgb(${Math.random() * 150 + 30}, ${
              Math.random() * 150 + 30
            }, ${Math.random() * 150 + 30})`,
          }}
        >
          {record.displayedName[0]}
        </Avatar>
      ),
      align: "center",
    },
    {
      title: <strong>Matric Number</strong>,
      dataIndex: "cardID",
      key: "cardID",
      align: "center",
      sorter: (a, b) => a.cardID.localeCompare(b.cardID),
    },
    {
      title: <strong>Name</strong>,
      dataIndex: "displayedName",
      key: "displayedName",
      align: "center",
      sorter: (a, b) => a.displayedName.localeCompare(b.displayedName),
    },
    {
      title: <strong>Attend Rate</strong>,
      dataIndex: "attendRate",
      key: "attendRate",
      render: (text) =>
        text !== null ? (
          <Tag color={text === 0 ? "#f00" : text <= 80 ? "#f90" : "#0c8"}>
            {text}%
          </Tag>
        ) : (
          <Tag className="alert">No attendance record yet</Tag>
        ),
      align: "center",
      sorter: {
        compare: (a, b) => a.attendRate - b.attendRate,
        multiple: 2,
      },
    },
    {
      title: <strong>Warns</strong>,
      dataIndex: "warningCount",
      key: "warningCount",
      render: (text) => (
        <div>
          <p>{text}</p>
        </div>
      ),
      align: "center",
      sorter: {
        compare: (a, b) => a.warningCount - b.warningCount,
        multiple: 2,
      },
    },
    {
      title: <strong>Action</strong>,
      key: "action",
      render: (index) => (
        <Space size="middle">
          <Button
            danger
            className="courseDetails__warnBtn"
            onClick={() => {
              handleWarnParticipant(index.key, props.match.params.id);
              setSelectedParticipant(index);
            }}
            loading={
              index.key === selectedParticipant.key &&
              warnParticipantStatus.loading
            }
          >
            Warn
          </Button>
          <Button
            danger
            className="courseDetails__kickBtn"
            onClick={() => {
              setVisible(true);
              setSelectedParticipant(index);
            }}
            loading={
              index.key === selectedParticipant.key &&
              kickParticipantStatus.loading
            }
          >
            Kick
          </Button>
        </Space>
      ),
      align: "center",
    },
  ];

  const { user } = useContext(AuthContext);

  const [participants, setParticipants] = useState([]);
  const [selectedParticipant, setSelectedParticipant] = useState({});
  const [attendanceCount, setAttendanceCount] = useState(0);

  const [visible, setVisible] = useState(false);
  if (user.userLevel == 0) {
    columns.splice(-1, 1);
  }

  const { loading, data, error, refetch } = useQuery(FETCH_COURSE_QUERY, {
    onError(err) {
      CheckError(err);
    },
    variables: {
      id: props.match.params.id,
    },
    notifyOnNetworkStatusChange: true,
  });

  useEffect(() => {
    if (data) {
      setParticipants(data.getCourseAndParticipants.participants);
      setAttendanceCount(data.getCourseAndParticipants.attendanceCount);
    }
  }, [data]);

  const [kickParticipantCallback, kickParticipantStatus] = useMutation(
    KICK_PARTICIPANT_MUTATION,
    {
      onCompleted: (data) => {
        message.success(data.kickParticipant);
      },
      onError(err) {
        CheckError(err);
      },
    }
  );

  const [warnParticipantCallback, warnParticipantStatus] = useMutation(
    WARN_PARTICIPANT_MUTATION,
    {
      onCompleted: (data) => {
        message.success(data.warnParticipant);
      },
      onError(err) {
        CheckError(err);
      },
    }
  );

  const handleKickParticipant = (participantID, courseID) => {
    kickParticipantCallback({
      update() {
        const updatedParticipant = participants.filter(
          (participant) => participant.key !== participantID
        );
        setParticipants(updatedParticipant);
        //refetch the participant after kicked
        refetch();
        setVisible(false);
      },
      variables: { participantID, courseID },
    });
  };

  const handleWarnParticipant = (participantID, courseID) => {
    warnParticipantCallback({
      update() {
        const updatedParticipant = participants.filter(
          (participant) => participant.key === participantID
        );
        updatedParticipant.map((item) => (item.warningCount += 1));
        //refetch the participant after warned
        refetch();
      },
      variables: { participantID, courseID },
    });
  };

  const titleList = [
    { name: "Home", link: "/dashboard" },
    {
      name: `Course: ${props.match.params.id}`,
      link: `/course/${props.match.params.id}`,
    },
  ];

  const parsedParticipants = (participants) => {
    const currUser = participants.find((par) => par.info._id === user._id);
    if (currUser)
      participants = [
        currUser,
        ...participants.filter((par) => par.info._id !== user._id),
      ];
    return participants.map((par) => {
      return {
        key: par.info._id,
        profilePictureURL: par.info.profilePictureURL,
        firstName: par.info.firstName,
        lastName: par.info.lastName,
        displayedName: par.info.firstName + " " + par.info.lastName,
        cardID: par.info.cardID,
        attendRate: par.attendRate,
        warningCount: par.warningCount,
      };
    });
  };

  return (
    <Layout className="courseDetails layout">
      <Navbar />
      <Layout>
        <Greeting
          firstName={user.firstName}
          profilePicture={user.profilePicture}
        />
        <PageTitleBreadcrumb titleList={titleList} />
        <Content>
          <Card className="courseDetails__card">
            {error && <ErrorComp err={error} />}
            {!error && (
                  data && (
                    <CourseDetailCard
                      course={data?.getCourseAndParticipants.course}
                      attendanceCount={attendanceCount}
                      participants={participants}
                    />
                  )
            )}
          </Card>
          <Divider
            orientation="left"
            style={{ color: "#333", fontWeight: "normal" }}
          >
            Participants
          </Divider>
          <Table
            scroll={{ x: "max-content" }}
            columns={columns}
            dataSource={parsedParticipants(participants)}
            loading={loading}
          />

          <Button
            style={{ float: "right" }}
            icon={<RedoOutlined />}
            disabled={loading}
            loading={loading}
            onClick={() => refetch()}
          >
            Refresh Table
          </Button>
          <Modal
            title="Delete Course"
            action={modalItems.participant.action.kick}
            itemType={modalItems.participant.name}
            visible={visible}
            loading={kickParticipantStatus.loading}
            handleOk={() =>
              handleKickParticipant(
                selectedParticipant.key,
                props.match.params.id
              )
            }
            handleCancel={() => setVisible(false)}
            payload={selectedParticipant}
          />
        </Content>
        <Footer />
      </Layout>
    </Layout>
  );
};
