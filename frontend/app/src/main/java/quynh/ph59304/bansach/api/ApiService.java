package quynh.ph59304.bansach.api;

import java.util.List;
import java.util.Map;

import quynh.ph59304.bansach.models.ApiResponse;
import quynh.ph59304.bansach.models.Book;
import quynh.ph59304.bansach.models.BooksResponse;
import quynh.ph59304.bansach.models.CategoriesResponse;
import quynh.ph59304.bansach.models.Category;
import quynh.ph59304.bansach.models.User;
import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.GET;
import retrofit2.http.Header;
import retrofit2.http.POST;
import retrofit2.http.Path;
import retrofit2.http.Query;

public interface ApiService {
    // Authentication
    @POST("api/register")
    Call<ApiResponse<User>> register(@Body User user);

    @POST("api/login")
    Call<ApiResponse<User>> login(@Body User user);

    @POST("api/forgot-password")
    Call<ApiResponse<Void>> forgotPassword(@Body Map<String, String> body);

    @GET("api/profile")
    Call<ApiResponse<User>> getProfile(@Header("Authorization") String token);

    // Books
    @GET("api/books")
    Call<BooksResponse> getBooks(
            @Query("search") String search,
            @Query("category") String category,
            @Query("minPrice") Double minPrice,
            @Query("maxPrice") Double maxPrice
    );

    @GET("api/books/{id}")
    Call<ApiResponse<Book>> getBookDetail(@Path("id") String id);

    @GET("api/categories")
    Call<CategoriesResponse> getCategories();
}
