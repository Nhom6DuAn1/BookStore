package quynh.ph59304.bansach;

import android.os.Bundle;
import android.view.View;
import android.widget.ImageView;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;

import com.bumptech.glide.Glide;

import quynh.ph59304.bansach.api.ApiService;
import quynh.ph59304.bansach.api.RetrofitClient;
import quynh.ph59304.bansach.models.ApiResponse;
import quynh.ph59304.bansach.models.Book;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class BookDetailActivity extends AppCompatActivity {
    private ImageView imgBookCover;
    private TextView tvTitle, tvAuthor, tvCategory, tvPrice, tvDescription;
    private ProgressBar progressBar;
    private ApiService apiService;
    private String bookId;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_book_detail);

        bookId = getIntent().getStringExtra("book_id");
        if (bookId == null) {
            Toast.makeText(this, "Không tìm thấy thông tin sách", Toast.LENGTH_SHORT).show();
            finish();
            return;
        }

        apiService = RetrofitClient.getInstance().getApiService();

        initViews();
        setupToolbar();
        loadBookDetail();
    }

    private void initViews() {
        imgBookCover = findViewById(R.id.imgBookCover);
        tvTitle = findViewById(R.id.tvTitle);
        tvAuthor = findViewById(R.id.tvAuthor);
        tvCategory = findViewById(R.id.tvCategory);
        tvPrice = findViewById(R.id.tvPrice);
        tvDescription = findViewById(R.id.tvDescription);
        progressBar = findViewById(R.id.progressBar);
    }

    private void setupToolbar() {
        Toolbar toolbar = findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);
        if (getSupportActionBar() != null) {
            getSupportActionBar().setDisplayHomeAsUpEnabled(true);
            getSupportActionBar().setDisplayShowHomeEnabled(true);
        }
        toolbar.setNavigationOnClickListener(v -> onBackPressed());
    }

    private void loadBookDetail() {
        showProgress(true);
        Call<ApiResponse<Book>> call = apiService.getBookDetail(bookId);
        call.enqueue(new Callback<ApiResponse<Book>>() {
            @Override
            public void onResponse(Call<ApiResponse<Book>> call, Response<ApiResponse<Book>> response) {
                showProgress(false);
                if (response.isSuccessful() && response.body() != null) {
                    Book book = response.body().getBook();
                    if (book != null) {
                        displayBook(book);
                    } else {
                        Toast.makeText(BookDetailActivity.this, "Không tìm thấy thông tin sách", Toast.LENGTH_SHORT).show();
                        finish();
                    }
                } else {
                    Toast.makeText(BookDetailActivity.this, "Không thể tải thông tin sách", Toast.LENGTH_SHORT).show();
                    finish();
                }
            }

            @Override
            public void onFailure(Call<ApiResponse<Book>> call, Throwable t) {
                showProgress(false);
                Toast.makeText(BookDetailActivity.this, "Lỗi kết nối: " + t.getMessage(), Toast.LENGTH_SHORT).show();
                finish();
            }
        });
    }

    private void displayBook(Book book) {
        tvTitle.setText(book.getTitle());
        tvAuthor.setText(book.getAuthor());
        tvPrice.setText(String.format("%,.0f đ", book.getPrice()));
        tvDescription.setText(book.getDescription());

        if (book.getCategory() != null) {
            tvCategory.setText(book.getCategory().getName());
        } else {
            tvCategory.setText("Không phân loại");
        }

        // Load image
        String imageUrl = book.getCoverImage();
        if (imageUrl != null && !imageUrl.isEmpty()) {
            if (!imageUrl.startsWith("http")) {
                imageUrl = "http://10.0.2.2:3000" + imageUrl;
            }
            Glide.with(this)
                    .load(imageUrl)
                    .placeholder(R.drawable.ic_launcher_background)
                    .error(R.drawable.ic_launcher_background)
                    .into(imgBookCover);
        }
    }

    private void showProgress(boolean show) {
        progressBar.setVisibility(show ? View.VISIBLE : View.GONE);
    }
}
