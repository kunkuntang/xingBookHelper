const app = getApp()
const Bmob = app.Bmob

Page({

  /**
   * 页面的初始数据
   */
  data: {
    bookListId: '',
    bookListName: '',
    academyName: '',
    majorName: '',
    majorId: '',
    selectedBooksArr: [],
    sumPrice: 0,

    booksArr: [],
  },
  checkboxChange: function (e) {
    console.log('checkbox发生change事件，携带value值为：', e.detail.value);
    let sumPrice = 0
    var booksArr = this.data.booksArr, values = e.detail.value;
    for (var i = 0, lenI = booksArr.length; i < lenI; ++i) {
      booksArr[i].attributes.checked = false;

      for (var j = 0, lenJ = values.length; j < lenJ; ++j) {
        if (booksArr[i].id == values[j]) {
          // booksArr[i].checked = true;
          booksArr[i].attributes.checked = true;
          sumPrice += booksArr[i].attributes.bookFinalPri
          break;
        }
      }
    }

    this.setData({
      booksArr: booksArr,
      sumPrice: sumPrice,
      selectedBooksArr: values
    });
  },
  submitBill: function(){
    let that = this
    let currentUser = Bmob.User.current();
    let User = new Bmob.User()
    User.id = currentUser.id

    let bookList = Bmob.Object.createWithoutData('bookList', this.data.bookListId)

    let majorList = Bmob.Object.createWithoutData('majorList', this.data.majorId)

    let academyList = Bmob.Object.createWithoutData('academyList', this.data.academyId)
    
    let BookBills = Bmob.Object.extend('bookBills')
    let billQuery = new Bmob.Query(BookBills)
    let bill = new BookBills()

    bill.set("belongAcademy", academyList)
    bill.set("belongMajor", majorList)
    bill.set("belongBookList", bookList)
    bill.set("belongUser", User)
    let tempData = []
    let booksArr = this.data.booksArr
    for (let i = 0; i < booksArr.length; i++) {
      let curBook = booksArr[i].attributes
      console.log("booksArr[i]", booksArr[i])
      
      if (curBook.checked)  {
        tempData.push({
          bookId: booksArr[i].id,
          bookDisc: curBook.bookDisc,
          bookName: curBook.bookName,
          bookPrice: curBook.bookPrice,
          bookFinalPri: curBook.bookFinalPri
        })
      }
    }
    // bill.set("bookListName", this.data.bookListName)
    bill.set("sumPrice", this.data.sumPrice )
    bill.set("containBooks", JSON.stringify(tempData))
    
    /**
     * {
      belongUser: app.globalData.userBmobId,
      bookListName: app.globalData.bookListName,
      bookListId: app.globalData.bookListId,
      belongAcaName: app.globalData.belongAcaName,
      belongMajName: app.globalData.belongMajName,
      sumPrice: sumPrice,
      containBooks: tempData
    }
     */

    billQuery.equalTo("belongUser", currentUser.id)
    billQuery.equalTo("belongBookList", this.data.bookListId)
    billQuery.find({
      success: function(res) {
        console.log(res)
        if (!res.length) {
          bill.save(null, {
            success: function(result) {
              console.log(result)
              let Books = new Bmob.Object.extend("books")
              let book = new Books()
              console.log(that.data.selectedBooksArr)
              that.data.selectedBooksArr.forEach((el) => {
                book.id = el
                book.increment("buyCount")
                book.save(null, {
                  success: function(){
                    wx.redirectTo({
                      url: '/pages/bookBillPreview/bookBillPreview?bookBillId=' + result.id + '&isEdited=true',
                    })
                  },
                  error: function(error) {
                    console.log(error)
                  }
                })
              })
            },
            error: function(result, error){
              console.log(error)
            }
          })
        } else {
          wx.showModal({
            title: '不能重复购买',
            content: '你已购买过此书单！你可以修改之前预订的订单',
            confirmText: "修改",
            cancelText: "取消",
            success: function (res) {
              console.log(res);
              if (res.confirm) {
                wx.redirectTo({
                  url: '/pages/bookBillPreview/bookBillPreview?bookBillId=' + res.id,
                })
              } else {
                console.log('用户点击辅助操作')
              }
            }
          });
        }
      }
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let that = this
    let bookListId = options.bookListId

    let bookList = Bmob.Object.createWithoutData('bookList', bookListId)

    let Books = Bmob.Object.extend('books')
    let booksQuery = new Bmob.Query(Books)
    booksQuery.equalTo('belongBookList', bookList)
    booksQuery.include("belongBookList", "belongMajor", "belongAcademy")

    booksQuery.find({
      success: function(results) {
        console.log(results)
        let academyName = ''
        let academyId = ''
        let majorName = ''
        let majorId = ''
        let bookListName = ''

        results.forEach((el) => {
          bookListName = el.attributes.belongBookList.bookListName
          academyName = el.attributes.belongAcademy.academyName
          academyId = el.attributes.belongAcademy.objectId
          majorName = el.attributes.belongMajor.majorName
          majorId = el.attributes.belongMajor.objectId
          // belongMajorId = el.attributes.belongBookList.belongMajor.objectId
          el.attributes.checked = false
          el.attributes.bookFinalPri = 
          Number(el.attributes.bookPrice) * Number(el.attributes.bookDisc) * 0.1
        })

        that.setData({
          booksArr: results,
          bookListName: bookListName,
          academyName: academyName,
          academyId: academyId,
          majorName: majorName,
          majorId: majorId,
          bookListId: bookListId
        })
      }
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },
  
})