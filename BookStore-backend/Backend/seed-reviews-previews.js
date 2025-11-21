// seed-reviews-previews.js - Thêm dữ liệu test cho reviews và preview content
const mongoose = require('mongoose');
const Book = require('./models/Book');
const User = require('./models/User');
const Review = require('./models/Review');
const PreviewContent = require('./models/PreviewContent');
const Order = require('./models/Order');

require('dotenv').config();

const mongoDB = process.env.MONGODB_URI || 'mongodb://localhost:27017/bookstore';

mongoose.connect(mongoDB)
    .then(() => {
        console.log('MongoDB connected for seeding reviews and previews...');
        seedReviewsAndPreviews();
    })
    .catch(err => console.log(err));

const seedReviewsAndPreviews = async () => {
    try {
        console.log('Starting to seed reviews and preview content...');

        // Get some existing books and users
        const books = await Book.find().limit(5);
        const users = await User.find().limit(3);

        if (books.length === 0 || users.length === 0) {
            console.log('Please make sure you have books and users in the database first.');
            return;
        }

        console.log(`Found ${books.length} books and ${users.length} users`);

        // Create some test orders so users can review books
        console.log('Creating test orders...');
        for (let i = 0; i < users.length; i++) {
            for (let j = 0; j < Math.min(2, books.length); j++) {
                const subtotal = books[j].price * 1;
                const order = new Order({
                    user: users[i]._id,
                    items: [{
                        book: books[j]._id,
                        quantity: 1,
                        price: books[j].price,
                        subtotal: subtotal
                    }],
                    shippingAddress: {
                        fullName: `${users[i].username} Test`,
                        address: '123 Test Street',
                        city: 'Ho Chi Minh City',
                        postalCode: '70000',
                        phone: '0123456789'
                    },
                    paymentMethod: 'cash_on_delivery',
                    paymentStatus: 'paid',
                    orderStatus: 'delivered',
                    totalAmount: subtotal,
                    shippingFee: 30000,
                    finalAmount: subtotal + 30000
                });
                
                try {
                    await order.save();
                    console.log(`Created order for user ${users[i].username} and book ${books[j].title}`);
                } catch (err) {
                    if (!err.message.includes('duplicate key')) {
                        console.log(`Error creating order: ${err.message}`);
                    }
                }
            }
        }

        // Create sample reviews
        console.log('Creating sample reviews...');
        const sampleReviews = [
            {
                user: users[0]._id,
                book: books[0]._id,
                rating: 5,
                comment: 'Cuốn sách tuyệt vời! Tôi đã đọc từ đầu đến cuối mà không thể rời mắt. Câu chuyện hấp dẫn và nhân vật được xây dựng rất sinh động. Chắc chắn sẽ giới thiệu cho bạn bè.'
            },
            {
                user: users[1]._id,
                book: books[0]._id,
                rating: 4,
                comment: 'Nội dung hay và bổ ích. Có một số phần hơi khó hiểu nhưng nhìn chung rất đáng đọc. Tác giả có cách viết lôi cuốn và thu hút người đọc.'
            },
            {
                user: users[0]._id,
                book: books[1]._id,
                rating: 5,
                comment: 'Một trong những cuốn sách khoa học hay nhất mà tôi từng đọc. Stephen Hawking đã giải thích những khái niệm phức tạp một cách dễ hiểu. Rất khuyến khích!'
            },
            {
                user: users[1]._id,
                book: books[1]._id,
                rating: 4,
                comment: 'Sách rất thú vị và mang tính giáo dục cao. Tuy có một số phần khó nhưng đáng để đầu tư thời gian đọc.'
            }
        ];

        // Clear existing reviews
        await Review.deleteMany({});
        
        for (let reviewData of sampleReviews) {
            try {
                const review = new Review(reviewData);
                await review.save();
                console.log(`Created review for book ${reviewData.book}`);
                
                // Update book rating
                const book = await Book.findById(reviewData.book);
                if (book) {
                    await book.updateRating();
                    console.log(`Updated rating for book ${book.title}`);
                }
            } catch (err) {
                console.log(`Error creating review: ${err.message}`);
            }
        }

        // Create sample preview content
        console.log('Creating sample preview content...');
        
        // Clear existing preview content
        await PreviewContent.deleteMany({});
        
        const samplePreviewContents = [
            {
                book: books[0]._id,
                chapters: [
                    {
                        chapterNumber: 1,
                        title: 'Khởi đầu của một hành trình',
                        content: `Đây là chương đầu tiên của cuốn sách. Trong chương này, chúng ta sẽ được giới thiệu về nhân vật chính và bối cảnh của câu chuyện.

Nhân vật chính là một người trẻ tuổi với những ước mơ lớn lao. Anh ta sống trong một thị trấn nhỏ, nơi mọi người đều biết nhau và cuộc sống diễn ra một cách bình yên.

Tuy nhiên, sự bình yên này sắp bị phá vỡ bởi một sự kiện bất ngờ sẽ thay đổi hoàn toàn cuộc đời của anh ta...`
                    },
                    {
                        chapterNumber: 2,
                        title: 'Cuộc gặp gỡ định mệnh',
                        content: `Chương hai đánh dấu một bước ngoặt quan trọng trong câu chuyện. Nhân vật chính gặp gỡ một người bạn mới sẽ đóng vai trò quan trọng trong hành trình sắp tới.

Cuộc gặp gỡ này diễn ra một cách tình cờ, nhưng như định mệnh đã sắp đặt. Người bạn mới này mang đến những thông tin quan trọng về một bí mật được giấu kín từ lâu.

Từ đây, cuộc phiêu lưu thực sự bắt đầu...`
                    },
                    {
                        chapterNumber: 3,
                        title: 'Bí mật được hé lộ',
                        content: `Trong chương ba, chúng ta sẽ khám phá được những bí mật đầu tiên của câu chuyện. Những sự thật được che giấu bắt đầu được hé lộ.

Nhân vật chính phát hiện ra rằng gia đình mình có một quá khứ không đơn giản như anh ta từng nghĩ. Có những điều mà bố mẹ anh chưa bao giờ kể cho anh nghe.

Với những thông tin mới này, anh ta phải đưa ra quyết định quan trọng: có nên tiếp tục tìm hiểu sự thật hay dừng lại ở đây?`
                    }
                ]
            },
            {
                book: books[1]._id,
                chapters: [
                    {
                        chapterNumber: 1,
                        title: 'Giới thiệu về Vũ trụ',
                        content: `Chương đầu tiên của cuốn sách khoa học này sẽ đưa chúng ta vào một hành trình khám phá vũ trụ bao la.

Vũ trụ là tất cả những gì tồn tại - từ những hạt nhỏ nhất đến những thiên hà rộng lớn nhất. Nó chứa đựng mọi thứ mà chúng ta biết và cả những điều chúng ta chưa khám phá được.

Để hiểu về vũ trụ, trước tiên chúng ta cần hiểu về thời gian và không gian, hai khái niệm cơ bản nhất của vật lý học...`
                    },
                    {
                        chapterNumber: 2,
                        title: 'Thời gian và Không gian',
                        content: `Thời gian và không gian không phải là những thực thể độc lập mà có mối quan hệ chặt chẽ với nhau. Einstein đã chứng minh điều này qua thuyết tương đối của ông.

Theo thuyết tương đối, thời gian có thể chạy chậm hơn hoặc nhanh hơn tùy thuộc vào tốc độ di chuyển và trường hấp dẫn. Đây là một khái niệm rất khó hình dung nhưng đã được chứng minh bằng thực nghiệm.

Không gian cũng không phải là cố định mà có thể bị uốn cong bởi khối lượng và năng lượng...`
                    },
                    {
                        chapterNumber: 3,
                        title: 'Big Bang - Sự khởi đầu của tất cả',
                        content: `Big Bang là lý thuyết được chấp nhận rộng rãi nhất về sự hình thành của vũ trụ. Theo lý thuyết này, vũ trụ bắt đầu từ một điểm cực nhỏ với mật độ và nhiệt độ cực lớn.

Khoảng 13.8 tỷ năm trước, điểm này bắt đầu giãn nở với tốc độ cực nhanh, tạo ra không gian và thời gian như chúng ta biết ngày nay.

Trong những giây đầu tiên sau Big Bang, vũ trụ đã trải qua những thay đổi dramatic...`
                    }
                ]
            },
            {
                book: books[2]._id,
                chapters: [
                    {
                        chapterNumber: 1,
                        title: 'Ở một cái hố trong đất',
                        content: `Trong một cái hố ở đất sống một hobbit. Không phải là cái hố ẩm ướt, bẩn thỉu, đầy giun với mùi bùn tanh, cũng không phải cái hố khô cằn, cát sỏi, không có chỗ ngồi hay ăn uống: đó là cái hố hobbit, có nghĩa là thoải mái.

Cái hố có một cánh cửa tròn màu xanh lá cây rất đẹp, như cái cửa tàu, có tay nắm đồng sáng bóng ngay chính giữa. Cánh cửa mở vào một hành lang hình ống, khá rộng, giống như đường hầm, rất thoải mái với những bức tường ốp gỗ.

Bilbo Baggins là tên của hobbit này, và anh ta đang sống cuộc đời bình yên của mình trong Bag End...`
                    },
                    {
                        chapterNumber: 2,
                        title: 'Khi có khách đến thăm',
                        content: `Một buổi sáng đẹp trời, Bilbo đang đứng ở cửa sau một bữa sáng thịnh soạn, hút tẩu và thổi những vòng khói màu xám tuyệt đẹp bay lên không trung.

Đột nhiên, Gandalf xuất hiện! Gandalf the Grey, phù thủy nổi tiếng đi đây đó khuyến khích những cuộc phiêu lưu.

"Chào buổi sáng!" Bilbo nói, và ý anh ta thực sự là vậy. Mặt trời đang chiếu sáng, cỏ xanh mướt.

"Ý ông muốn nói gì?" Gandalf hỏi. "Ông có ý nói với tôi một buổi sáng tốt lành, hay ông nghĩ rằng đó là một buổi sáng tốt lành dù ông có muốn hay không?"...`
                    },
                    {
                        chapterNumber: 3,
                        title: 'Những vị khách bất ngờ',
                        content: `Đúng lúc chuông cửa reo, Bilbo nhớ lại lời mời uống trà của mình. Ông vội vã đi mở cửa, nghĩ rằng đó là Gandalf đã quay lại.

Nhưng không phải! Đó là một người lùn với chiếc mũ cót màu xanh có lông mào vàng dài, đai da màu bạc, và bộ râu màu vàng rất dài được nhét vào đai.

"Dwalin phục vụ!" anh ta nói với một cái cúi đầu sâu.

"Bilbo Baggins phục vụ!" Bilbo đáp lại, nhưng không mấy vui vẻ. Ông không nhớ mình có mời ai tên Dwalin uống trà...`
                    }
                ]
            }
        ];

        for (let previewData of samplePreviewContents) {
            try {
                const preview = new PreviewContent(previewData);
                await preview.save();
                
                // Update book hasPreview flag
                await Book.findByIdAndUpdate(previewData.book, { hasPreview: true });
                
                const book = await Book.findById(previewData.book);
                console.log(`Created preview content for book: ${book.title}`);
            } catch (err) {
                console.log(`Error creating preview: ${err.message}`);
            }
        }

        console.log('Seeding completed successfully!');

    } catch (err) {
        console.error('Error seeding reviews and previews:', err);
    } finally {
        mongoose.connection.close();
        console.log('MongoDB connection closed.');
    }
};

module.exports = seedReviewsAndPreviews;