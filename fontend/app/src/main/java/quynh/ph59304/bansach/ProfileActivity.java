package quynh.ph59304.bansach;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
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
import quynh.ph59304.bansach.models.User;
import quynh.ph59304.bansach.utils.SharedPreferencesManager;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class ProfileActivity extends AppCompatActivity {
    private ImageView imgAvatar;
    private TextView tvUsername, tvRole, tvRoleDetail;
    private com.google.android.material.textfield.TextInputEditText edtUsername;
    private Button btnLogout;
    private ProgressBar progressBar;
    private ApiService apiService;
    private SharedPreferencesManager prefManager;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_profile);

        apiService = RetrofitClient.getInstance().getApiService();
        prefManager = new SharedPreferencesManager(this);

        // Kiểm tra đăng nhập
        if (!prefManager.isLoggedIn()) {
            startActivity(new Intent(this, LoginActivity.class));
            finish();
            return;
        }

        initViews();
        setupToolbar();
        loadProfile();
        setupLogout();
    }

    private void initViews() {
        imgAvatar = findViewById(R.id.imgAvatar);
        tvUsername = findViewById(R.id.tvUsername);
        tvRole = findViewById(R.id.tvRole);
        tvRoleDetail = findViewById(R.id.tvRoleDetail);
        edtUsername = findViewById(R.id.edtUsername);
        btnLogout = findViewById(R.id.btnLogout);
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

    private void loadProfile() {
        String token = prefManager.getToken();
        if (token == null) {
            Toast.makeText(this, "Phiên đăng nhập đã hết hạn", Toast.LENGTH_SHORT).show();
            prefManager.clear();
            startActivity(new Intent(this, LoginActivity.class));
            finish();
            return;
        }

        showProgress(true);
        Call<ApiResponse<User>> call = apiService.getProfile("Bearer " + token);
        call.enqueue(new Callback<ApiResponse<User>>() {
            @Override
            public void onResponse(Call<ApiResponse<User>> call, Response<ApiResponse<User>> response) {
                showProgress(false);
                if (response.isSuccessful() && response.body() != null) {
                    User user = response.body().getUser();
                    if (user != null) {
                        displayUser(user);
                    } else {
                        // Fallback to cached data
                        displayCachedUser();
                    }
                } else {
                    // Fallback to cached data
                    displayCachedUser();
                }
            }

            @Override
            public void onFailure(Call<ApiResponse<User>> call, Throwable t) {
                showProgress(false);
                // Fallback to cached data
                displayCachedUser();
            }
        });
    }

    private void displayUser(User user) {
        tvUsername.setText(user.getUsername());
        edtUsername.setText(user.getUsername());
        
        String role = user.getRole();
        if (role != null) {
            if (role.equals("admin")) {
                tvRole.setText("Quản trị viên");
                tvRoleDetail.setText("Quản trị viên");
            } else {
                tvRole.setText("Khách hàng");
                tvRoleDetail.setText("Khách hàng");
            }
        }

        // Load avatar
        String avatarUrl = user.getAvatar();
        if (avatarUrl != null && !avatarUrl.isEmpty()) {
            if (!avatarUrl.startsWith("http")) {
                avatarUrl = "http://10.0.2.2:3000" + avatarUrl;
            }
            Glide.with(this)
                    .load(avatarUrl)
                    .placeholder(R.drawable.ic_launcher_background)
                    .error(R.drawable.ic_launcher_background)
                    .circleCrop()
                    .into(imgAvatar);
        }

        // Update cached data
        prefManager.saveUserInfo(
                user.getId(),
                user.getUsername(),
                user.getRole(),
                user.getAvatar() != null ? user.getAvatar() : ""
        );
    }

    private void displayCachedUser() {
        String username = prefManager.getUsername();
        String role = prefManager.getRole();
        String avatar = prefManager.getAvatar();

        if (username != null) {
            tvUsername.setText(username);
            edtUsername.setText(username);
        }

        if (role != null) {
            if (role.equals("admin")) {
                tvRole.setText("Quản trị viên");
                tvRoleDetail.setText("Quản trị viên");
            } else {
                tvRole.setText("Khách hàng");
                tvRoleDetail.setText("Khách hàng");
            }
        }

        if (avatar != null && !avatar.isEmpty()) {
            String avatarUrl = avatar;
            if (!avatarUrl.startsWith("http")) {
                avatarUrl = "http://10.0.2.2:3000" + avatarUrl;
            }
            Glide.with(this)
                    .load(avatarUrl)
                    .placeholder(R.drawable.ic_launcher_background)
                    .error(R.drawable.ic_launcher_background)
                    .circleCrop()
                    .into(imgAvatar);
        }
    }

    private void setupLogout() {
        btnLogout.setOnClickListener(v -> {
            prefManager.clear();
            Toast.makeText(this, "Đã đăng xuất", Toast.LENGTH_SHORT).show();
            startActivity(new Intent(this, LoginActivity.class));
            finish();
        });
    }

    private void showProgress(boolean show) {
        progressBar.setVisibility(show ? View.VISIBLE : View.GONE);
    }
}
