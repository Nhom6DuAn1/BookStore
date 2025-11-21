package quynh.ph59304.bansach;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import quynh.ph59304.bansach.adapters.CartAdapter;
import quynh.ph59304.bansach.api.ApiService;
import quynh.ph59304.bansach.api.RetrofitClient;
import quynh.ph59304.bansach.models.ApiResponse;
import quynh.ph59304.bansach.models.CartItem;
import quynh.ph59304.bansach.models.CartResponse;
import quynh.ph59304.bansach.utils.SharedPreferencesManager;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class CartActivity extends AppCompatActivity {
    private static final String TAG = "CartActivity";
    private RecyclerView recyclerViewCart;
    private CartAdapter cartAdapter;
    private TextView tvTotalAmount, tvEmpty;
    private Button btnCheckout;
    private ProgressBar progressBar;
    private ApiService apiService;
    private SharedPreferencesManager prefManager;
    private List<CartItem> cartItems = new ArrayList<>();
    private double totalAmount = 0;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_cart);

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
        setupRecyclerView();
        loadCart();
    }

    private void initViews() {
        recyclerViewCart = findViewById(R.id.recyclerViewCart);
        tvTotalAmount = findViewById(R.id.tvTotalAmount);
        tvEmpty = findViewById(R.id.tvEmpty);
        btnCheckout = findViewById(R.id.btnCheckout);
        progressBar = findViewById(R.id.progressBar);

        btnCheckout.setOnClickListener(v -> {
            if (cartItems.isEmpty()) {
                Toast.makeText(this, "Giỏ hàng trống", Toast.LENGTH_SHORT).show();
                return;
            }
            Intent intent = new Intent(this, CheckoutActivity.class);
            startActivity(intent);
        });
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

    private void setupRecyclerView() {
        cartAdapter = new CartAdapter(cartItems, new CartAdapter.OnCartItemClickListener() {
            @Override
            public void onQuantityChanged(CartItem item, int newQuantity) {
                updateCartItem(item, newQuantity);
            }

            @Override
            public void onItemRemoved(CartItem item) {
                removeCartItem(item);
            }
        });
        recyclerViewCart.setLayoutManager(new LinearLayoutManager(this));
        recyclerViewCart.setAdapter(cartAdapter);
    }

    private void loadCart() {
        showProgress(true);
        Call<ApiResponse<CartResponse>> call = apiService.getCart();
        call.enqueue(new Callback<ApiResponse<CartResponse>>() {
            @Override
            public void onResponse(Call<ApiResponse<CartResponse>> call, Response<ApiResponse<CartResponse>> response) {
                showProgress(false);
                if (response.isSuccessful() && response.body() != null) {
                    ApiResponse<CartResponse> apiResponse = response.body();
                    CartResponse cartResponse = apiResponse.getCart();
                    if (cartResponse == null && apiResponse.getData() != null) {
                        cartResponse = apiResponse.getData();
                    }
                    
                    if (cartResponse != null && cartResponse.getItems() != null) {
                        cartItems = cartResponse.getItems();
                        totalAmount = cartResponse.getTotalAmount();
                        updateUI();
                    } else {
                        cartItems = new ArrayList<>();
                        totalAmount = 0;
                        updateUI();
                    }
                } else {
                    Log.e(TAG, "Load cart failed: " + response.code() + " - " + response.message());
                    Toast.makeText(CartActivity.this, "Không thể tải giỏ hàng", Toast.LENGTH_SHORT).show();
                    showEmpty(true);
                }
            }

            @Override
            public void onFailure(Call<ApiResponse<CartResponse>> call, Throwable t) {
                showProgress(false);
                Log.e(TAG, "Load cart error: " + t.getMessage(), t);
                Toast.makeText(CartActivity.this, "Lỗi kết nối: " + t.getMessage(), Toast.LENGTH_SHORT).show();
                showEmpty(true);
            }
        });
    }

    private void updateCartItem(CartItem item, int newQuantity) {
        showProgress(true);
        Map<String, Object> body = new HashMap<>();
        // Backend expects bookId and quantity
        if (item.getBook() != null) {
            body.put("bookId", item.getBook().getId());
        } else {
            body.put("bookId", item.getId());
        }
        body.put("quantity", newQuantity);

        Call<ApiResponse<CartResponse>> call = apiService.updateCartItem(body);
        call.enqueue(new Callback<ApiResponse<CartResponse>>() {
            @Override
            public void onResponse(Call<ApiResponse<CartResponse>> call, Response<ApiResponse<CartResponse>> response) {
                showProgress(false);
                if (response.isSuccessful() && response.body() != null) {
                    ApiResponse<CartResponse> apiResponse = response.body();
                    CartResponse cartResponse = apiResponse.getCart();
                    if (cartResponse == null && apiResponse.getData() != null) {
                        cartResponse = apiResponse.getData();
                    }
                    
                    if (cartResponse != null) {
                        cartItems = cartResponse.getItems();
                        totalAmount = cartResponse.getTotalAmount();
                        updateUI();
                    }
                    Toast.makeText(CartActivity.this, "Đã cập nhật giỏ hàng", Toast.LENGTH_SHORT).show();
                } else {
                    Toast.makeText(CartActivity.this, "Không thể cập nhật giỏ hàng", Toast.LENGTH_SHORT).show();
                    loadCart(); // Reload cart
                }
            }

            @Override
            public void onFailure(Call<ApiResponse<CartResponse>> call, Throwable t) {
                showProgress(false);
                Toast.makeText(CartActivity.this, "Lỗi kết nối: " + t.getMessage(), Toast.LENGTH_SHORT).show();
                loadCart(); // Reload cart
            }
        });
    }

    private void removeCartItem(CartItem item) {
        showProgress(true);
        String bookId = item.getBook() != null ? item.getBook().getId() : item.getId();
        Call<ApiResponse<CartResponse>> call = apiService.removeFromCart(bookId);
        call.enqueue(new Callback<ApiResponse<CartResponse>>() {
            @Override
            public void onResponse(Call<ApiResponse<CartResponse>> call, Response<ApiResponse<CartResponse>> response) {
                showProgress(false);
                if (response.isSuccessful() && response.body() != null) {
                    ApiResponse<CartResponse> apiResponse = response.body();
                    CartResponse cartResponse = apiResponse.getCart();
                    if (cartResponse == null && apiResponse.getData() != null) {
                        cartResponse = apiResponse.getData();
                    }
                    
                    if (cartResponse != null) {
                        cartItems = cartResponse.getItems();
                        totalAmount = cartResponse.getTotalAmount();
                        updateUI();
                    }
                    Toast.makeText(CartActivity.this, "Đã xóa sản phẩm", Toast.LENGTH_SHORT).show();
                } else {
                    Toast.makeText(CartActivity.this, "Không thể xóa sản phẩm", Toast.LENGTH_SHORT).show();
                    loadCart(); // Reload cart
                }
            }

            @Override
            public void onFailure(Call<ApiResponse<CartResponse>> call, Throwable t) {
                showProgress(false);
                Toast.makeText(CartActivity.this, "Lỗi kết nối: " + t.getMessage(), Toast.LENGTH_SHORT).show();
                loadCart(); // Reload cart
            }
        });
    }

    private void updateUI() {
        cartAdapter.updateCartItems(cartItems);
        tvTotalAmount.setText(String.format("%,.0f đ", totalAmount));
        btnCheckout.setEnabled(!cartItems.isEmpty());
        showEmpty(cartItems.isEmpty());
    }

    private void showProgress(boolean show) {
        progressBar.setVisibility(show ? View.VISIBLE : View.GONE);
        recyclerViewCart.setVisibility(show ? View.GONE : View.VISIBLE);
    }

    private void showEmpty(boolean show) {
        tvEmpty.setVisibility(show ? View.VISIBLE : View.GONE);
        recyclerViewCart.setVisibility(show ? View.GONE : View.VISIBLE);
    }

    @Override
    protected void onResume() {
        super.onResume();
        loadCart(); // Reload cart when returning to this activity
    }
}


