const noticeData = [
  {
    id: 1,
    title: "Hello",
    content: "javascript!",
  },
  {
    id: 2,
    title: "New open!",
    content: "open new service",
  },
  {
    id: 3,
    title: "Support new feature",
    content: "please check it more from...",
  },
];

const getNotice = async () => {
  await new Promise((resolve) => setTimeout(resolve(), 3000));
  return noticeData;
};

const getNoticeById = async (id) => {
  await new Promise((resolve) => setTimeout(resolve(), 3000));
  return noticeData.find((it) => it.id === id);
};

module.exports = {
  getNotice,
  getNoticeById,
};
