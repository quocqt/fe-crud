import { useState, useEffect } from "react";
import { 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  StyleSheet, 
  Image, 
  Alert,
  Modal,
  ScrollView,
  ActivityIndicator
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { Product } from "./models/Product";
import * as ImagePicker from "expo-image-picker";
import { fetchProducts, createProduct, updateProduct, deleteProduct } from "./services/ApiService";
import Login from './components/Login';
import Register from './components/Register';
import React from "react";

export default function Index() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Trạng thái cho form thêm/sửa sản phẩm
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState("");

  // Trạng thái để xác định màn hình nào đang hiển thị
  const [isLogin, setIsLogin] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Trạng thái xác thực

  // Lấy danh sách sản phẩm từ API
  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await fetchProducts();
      setProducts(data);
      setError(null);
    } catch (err) {
      setError("Không thể tải dữ liệu sản phẩm. Vui lòng thử lại sau.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Gọi API khi component được render
  useEffect(() => {
    if (isAuthenticated) {
      loadProducts(); // Tải sản phẩm chỉ khi đã xác thực
    }
  }, [isAuthenticated]);

  // Hàm để chuyển đổi giữa màn hình đăng nhập và đăng ký
  const toggleAuthMode = () => {
    setIsLogin((prevMode) => !prevMode);
  };

  // Hàm xử lý đăng nhập thành công
  const handleLoginSuccess = () => {
    setIsAuthenticated(true); // Đặt trạng thái xác thực
  };

  // Hàm xử lý đăng xuất
  const handleLogout = () => {
    setIsAuthenticated(false); // Reset trạng thái xác thực
    setIsLogin(true); // Tùy chọn: reset về màn hình đăng nhập
  };

  // Mở form thêm mới
  const openAddForm = () => {
    setEditingId(null);
    setName("");
    setCategory("");
    setPrice("");
    setImage("");
    setModalVisible(true);
  };

  // Mở form chỉnh sửa
  const openEditForm = (product: Product) => {
    setEditingId(product.id);
    setName(product.idsanpham);
    setCategory(product.loaisp);
    setPrice(product.gia.toString());
    setImage(product.hinhanh);
    setModalVisible(true);
  };

  // Lưu sản phẩm (thêm mới hoặc cập nhật)
  const saveProduct = async () => {
    // Kiểm tra dữ liệu đầu vào
    if (!name.trim() || !category.trim() || !price.trim()) {
      Alert.alert("Lỗi", "Vui lòng điền đầy đủ thông tin sản phẩm");
      return;
    }

    const priceNumber = parseFloat(price);
    if (isNaN(priceNumber) || priceNumber <= 0) {
      Alert.alert("Lỗi", "Giá sản phẩm không hợp lệ");
      return;
    }

    try {
      setLoading(true);
      
      const productData: Product = {
        id: editingId || Date.now().toString(),
        idsanpham: name.trim(),
        loaisp: category.trim(),
        gia: priceNumber,
        hinhanh: image || "https://via.placeholder.com/150"
      };

      if (editingId) {
        // Cập nhật sản phẩm hiện có
        await updateProduct(productData);
      } else {
        // Thêm sản phẩm mới
        await createProduct(productData);
      }

      // Tải lại danh sách sản phẩm sau khi cập nhật
      await loadProducts();
      
      // Đóng modal và reset form
      setModalVisible(false);
      resetForm();
      
    } catch (err) {
      console.error("Error saving product:", err);
      Alert.alert(
        "Lỗi", 
        editingId 
          ? "Không thể cập nhật sản phẩm. Vui lòng thử lại." 
          : "Không thể thêm sản phẩm mới. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setEditingId(null);
    setName("");
    setCategory("");
    setPrice("");
    setImage("");
  };

  // Xóa sản phẩm
  const deleteProductHandler = (id: string) => {
    Alert.alert(
      "Xác nhận xóa",
      "Bạn có chắc chắn muốn xóa sản phẩm này?",
      [
        { text: "Hủy", style: "cancel" },
        { 
          text: "Xóa", 
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await deleteProduct(id);
              await loadProducts(); // Tải lại danh sách sau khi xóa
            } catch (err) {
              console.error("Error deleting product:", err);
              Alert.alert("Lỗi", "Không thể xóa sản phẩm. Vui lòng thử lại.");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  // Chọn ảnh từ thư viện
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.log("Error picking image:", error);
      Alert.alert("Lỗi", "Không thể chọn ảnh. Vui lòng thử lại.");
    }
  };

  // Format giá tiền
  const formatPrice = (price: number) => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " đ";
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      {isAuthenticated ? (
        // Hiển thị phần quản lý sản phẩm nếu đã xác thực
        <>
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Quản lý sản phẩm</Text>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={24} color="blue" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={openAddForm}>
            <Ionicons name="add" size={24} color="white" />
            <Text style={styles.addButtonText}>Thêm sản phẩm</Text>
          </TouchableOpacity>

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4CAF50" />
              <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
            </View>
          )}

          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={40} color="#E53935" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity 
                style={styles.retryButton} 
                onPress={loadProducts}
              >
                <Text style={styles.retryButtonText}>Thử lại</Text>
              </TouchableOpacity>
            </View>
          )}

          {!loading && !error && (
            <FlatList
              data={products}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.productItem}>
                  <Image
                    source={{ uri: item.hinhanh }}
                    style={styles.productImage}
                    defaultSource={require('../assets/images/icon.png')}
                    resizeMode="cover"
                  />
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>{item.idsanpham}</Text>
                    <Text style={styles.productCategory}>Loại: {item.loaisp}</Text>
                    <Text style={styles.productPrice}>{formatPrice(item.gia)}</Text>
                  </View>
                  <View style={styles.actions}>
                    <TouchableOpacity 
                      onPress={() => openEditForm(item)}
                      style={styles.actionButton}
                    >
                      <Ionicons name="create-outline" size={24} color="#2196F3" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => deleteProductHandler(item.id)}
                      style={styles.actionButton}
                    >
                      <Ionicons name="trash-outline" size={24} color="#E53935" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              ListEmptyComponent={() => (
                <View style={styles.emptyContainer}>
                  <Ionicons name="basket-outline" size={64} color="#ccc" />
                  <Text style={styles.emptyText}>Chưa có sản phẩm nào</Text>
                  <Text style={styles.emptySubText}>Bấm "Thêm sản phẩm" để bắt đầu</Text>
                </View>
              )}
            />
          )}
        </>
      ) : (
        // Hiển thị giao diện đăng nhập hoặc đăng ký
        <>
          {isLogin ? (
            <Login onLoginSuccess={handleLoginSuccess} />
          ) : (
            <Register />
          )}
          <TouchableOpacity onPress={toggleAuthMode}>
            <Text style={styles.authText}>
              {isLogin ? "Chưa có tài khoản? Đăng ký" : "Đã có tài khoản? Đăng nhập"}
            </Text>
          </TouchableOpacity>
        </>
      )}

      {/* Modal Form thêm/sửa sản phẩm */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingId ? "Sửa sản phẩm" : "Thêm sản phẩm mới"}
            </Text>
            
            <ScrollView>
              <Text style={styles.inputLabel}>Tên sản phẩm</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập tên sản phẩm"
                value={name}
                onChangeText={setName}
              />
              
              <Text style={styles.inputLabel}>Loại sản phẩm</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập loại sản phẩm"
                value={category}
                onChangeText={setCategory}
              />
              
              <Text style={styles.inputLabel}>Giá (VND)</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập giá sản phẩm"
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
              />
              
              <Text style={styles.inputLabel}>Hình ảnh</Text>
              <View style={styles.imageInputContainer}>
                <TextInput
                  style={[styles.input, styles.imageInput]}
                  placeholder="Nhập URL hình ảnh"
                  value={image}
                  onChangeText={setImage}
                />
                <TouchableOpacity style={styles.pickImageButton} onPress={pickImage}>
                  <Ionicons name="image" size={24} color="white" />
                </TouchableOpacity>
              </View>
              
              {image ? (
                <Image source={{ uri: image }} style={styles.previewImage} />
              ) : null}
              
              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={[styles.button, styles.cancelButton]} 
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.buttonText}>Hủy</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.button, styles.saveButton]} 
                  onPress={saveProduct}
                >
                  <Text style={styles.buttonText}>Lưu</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 16,
    paddingTop: 60,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  logoutButton: {
    backgroundColor: "transparent",
    padding: 8,
  },
  addButton: {
    backgroundColor: "#4CAF50",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  addButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 8,
  },
  productItem: {
    backgroundColor: "white",
    borderRadius: 8,
    marginBottom: 16,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  productImage: {
    width: "100%",
    height: 180,
    backgroundColor: "#f0f0f0",
  },
  productInfo: {
    padding: 16,
  },
  productName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 6,
  },
  productCategory: {
    fontSize: 14,
    color: "#666",
    marginBottom: 6,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#E53935",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  actionButton: {
    padding: 8,
    marginLeft: 12,
  },
  emptyContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: -1,
  },
  emptyText: {
    fontSize: 18,
    color: "#888",
    fontWeight: "bold",
    marginTop: 12,
  },
  emptySubText: {
    fontSize: 16,
    color: "#aaa",
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    margin: 20,
    borderRadius: 12,
    padding: 20,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 6,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: "#fafafa",
  },
  imageInputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  imageInput: {
    flex: 1,
    marginBottom: 8,
  },
  pickImageButton: {
    backgroundColor: "#2196F3",
    padding: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  previewImage: {
    width: "100%",
    height: 200,
    marginBottom: 16,
    borderRadius: 8,
    resizeMode: "cover",
    backgroundColor: "#f0f0f0",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#ccc",
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: "#4CAF50",
    marginLeft: 8,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666'
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: '#E53935',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#2196F3',
    borderRadius: 4,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  authText: {
    color: 'blue',
    marginTop: -100,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
  },
});
