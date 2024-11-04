const PresentationSchema = require("../Schema/Presintation");

let setTitle = async (userID, text) => {
  try {
    let setTitle = await PresentationSchema.updateOne(
      { userID },
      { $set: { title: text } }
    );
    console.log(setTitle);
    return { success: true };
  } catch (e) {
    console.log(e);
    return { success: false };
  }
};
let removeLastSlide = async (userID) => {
  try {
    const result = await PresentationSchema.findOneAndUpdate(
      { userID }, // Условие поиска по userID
      { $pop: { sliders: 1 } }, // Операция удаления последнего элемента из массива
      { new: true } // Опция возвращения обновленного документа
    );
    return { success: !!result.sliders.length };
  } catch (e) {
    console.log(e);
    return { success: false };
  }
};
let setTitleSlide = async (userID, text) => {
  try {
    // Используйте $set для обновления поля title
    let setTitle = await PresentationSchema.updateOne(
      { userID },
      { $push: { sliders: { title: text } } }
    );

    console.log(setTitle);
    return { success: true };
  } catch (e) {
    console.log(e);
    return { success: false };
  }
};

let setBackgroundSlide = async (userID, background) => {
  try {
    let setText = await PresentationSchema.updateOne(
      { userID },
      { $set: { "sliders.$[lastUnfilled].background": background } },
      {
        arrayFilters: [
          {
            "lastUnfilled.title": { $exists: true },
            "lastUnfilled.background": { $exists: false },
          },
        ],
        sort: { "sliders._id": -1 },
      }
    );

    console.log(setText);
    return { success: setText.modifiedCount > 0 };
  } catch (e) {
    console.log(e);
    return { success: false };
  }
};
let setTextSlide = async (userID, text) => {
  try {
    let setText = await PresentationSchema.updateOne(
      { userID },
      { $set: { "sliders.$[lastUnfilled].text": text } },
      {
        arrayFilters: [
          {
            "lastUnfilled.title": { $exists: true },
            "lastUnfilled.text": { $exists: false },
          },
        ],
        sort: { "sliders._id": -1 },
      }
    );

    console.log(setText);
    return { success: setText.modifiedCount > 0 };
  } catch (e) {
    console.log(e);
    return { success: false };
  }
};

let removePresentation = async (userID) => {
  try {
    let findAndRemove = await PresentationSchema.updateOne(
      { userID },
      { $set: { sliders: [], title: null } }
    );
    return { success: true };
  } catch (e) {
    return { success: false };
  }
};

let getLastSlide = async (userID) => {
  try {
    let findSlide = await PresentationSchema.findOne({ userID })
      .select("sliders")
      .slice("sliders", -1);
    console.log(findSlide);
    return {
      success: true,
      data: {
        title: `${findSlide.sliders[0].title.slice(0, 30)}...`,
        text: `${findSlide.sliders[0].text.slice(0, 60)}...`,
        background: findSlide.sliders[0].background?findSlide.sliders[0].background:null
      },
    };
  } catch (e) {
    return { success: false };
  }
};
module.exports = {
  setTitle,
  setTitleSlide,
  removeLastSlide,
  setBackgroundSlide,
  removePresentation,
  setTextSlide,
  getLastSlide,
};
