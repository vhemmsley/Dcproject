<template>
  <!-- NAVIGATION -->
  <nav
    class="fixed top-0 left-0 right-0 z-50 glass-dark transition-all duration-300"
    :class="scrolled ? 'py-2' : 'py-4'"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
      <div class="flex items-center gap-3 cursor-pointer" @click="scrollTo('hero')">
        <div
          class="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center"
        >
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
        <span class="text-2xl font-black tracking-tight">NEXUS</span>
      </div>
      <div class="hidden lg:flex items-center gap-8">
        <a
          v-for="link in navLinks"
          :key="link.id"
          @click="scrollTo(link.id)"
          class="text-sm font-medium text-slate-300 hover:text-white cursor-pointer transition-colors relative group"
        >
          {{ link.label }}
          <span
            class="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-brand-500 to-accent-500 group-hover:w-full transition-all duration-300"
          ></span>
        </a>
      </div>
      <div class="flex items-center gap-4">
        <button
          @click="searchOpen = !searchOpen"
          class="p-2 rounded-xl hover:bg-white/10 transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </button>
        <button
          @click="wishlistOpen = !wishlistOpen"
          class="relative p-2 rounded-xl hover:bg-white/10 transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          <span
            v-if="wishlist.length"
            class="absolute -top-1 -right-1 w-5 h-5 bg-accent-500 rounded-full text-xs flex items-center justify-center font-bold"
            >{{ wishlist.length }}</span
          >
        </button>
        <button
          @click="cartOpen = !cartOpen"
          class="relative p-2 rounded-xl hover:bg-white/10 transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
          <span
            v-if="cart.length"
            class="absolute -top-1 -right-1 w-5 h-5 bg-brand-500 rounded-full text-xs flex items-center justify-center font-bold"
            >{{ cartItemCount }}</span
          >
        </button>
        <button
          class="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-accent-600 font-semibold text-sm hover:shadow-lg hover:shadow-brand-500/25 transition-all"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          Sign In
        </button>
        <button
          @click="mobileMenu = !mobileMenu"
          class="lg:hidden p-2 rounded-xl hover:bg-white/10"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>
    </div>
    <div v-if="searchOpen" class="border-t border-white/5 px-4 py-3">
      <div class="max-w-2xl mx-auto relative">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search products, brands, categories..."
          class="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 pl-12 text-white placeholder-slate-400 focus:outline-none focus:border-brand-500 transition-colors"
        />
        <svg
          class="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
    </div>
    <div v-if="mobileMenu" class="lg:hidden border-t border-white/5 px-4 py-4 space-y-2">
      <a
        v-for="link in navLinks"
        :key="link.id"
        @click="scrollTo(link.id)"
        class="block px-4 py-3 rounded-xl hover:bg-white/5 text-slate-300 hover:text-white transition-colors cursor-pointer"
        >{{ link.label }}</a
      >
    </div>
  </nav>

  <!-- HERO -->
  <section id="hero" class="relative min-h-screen flex items-center pt-20 overflow-hidden">
    <div
      class="blob w-96 h-96 bg-brand-500 top-20 -left-48 animate-float"
      style="animation-delay: 0s"
    ></div>
    <div
      class="blob w-80 h-80 bg-accent-500 bottom-20 -right-40 animate-float"
      style="animation-delay: 2s"
    ></div>
    <div
      class="blob w-64 h-64 bg-purple-500 top-1/2 left-1/3 animate-float"
      style="animation-delay: 1s; opacity: 0.2"
    ></div>
    <div
      class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid lg:grid-cols-2 gap-12 items-center"
    >
      <div class="space-y-8">
        <div
          class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-sm font-medium"
        >
          <span class="w-2 h-2 rounded-full bg-brand-400 animate-pulse"></span>
          New Collection 2026
        </div>
        <h1 class="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight">
          Shop the <br /><span class="gradient-text">Future</span> of <br />E-Commerce
        </h1>
        <p class="text-lg text-slate-400 max-w-lg leading-relaxed">
          Discover 50,000+ premium products across fashion, tech, home & more. Free shipping on
          orders over $50. Same-day delivery available in 200+ cities.
        </p>
        <div class="flex flex-wrap gap-4">
          <button
            @click="scrollTo('products')"
            class="px-8 py-4 rounded-2xl bg-gradient-to-r from-brand-600 to-accent-600 font-bold text-lg hover:shadow-2xl hover:shadow-brand-500/30 transition-all hover:-translate-y-1"
          >
            Explore Products
          </button>
          <button
            @click="scrollTo('categories')"
            class="px-8 py-4 rounded-2xl border border-white/20 font-bold text-lg hover:bg-white/5 transition-all"
          >
            Browse Categories
          </button>
        </div>
        <div class="flex items-center gap-8 pt-4">
          <div v-for="stat in heroStats" :key="stat.label">
            <div class="text-3xl font-black gradient-text">{{ stat.value }}</div>
            <div class="text-sm text-slate-400">{{ stat.label }}</div>
          </div>
        </div>
      </div>
      <div class="relative hidden lg:block">
        <div class="relative w-full aspect-square max-w-lg mx-auto">
          <div
            class="absolute inset-0 rounded-3xl bg-gradient-to-br from-brand-500/20 to-accent-500/20 blur-3xl"
          ></div>
          <img
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80"
            alt="Fashion"
            class="relative rounded-3xl shadow-2xl shadow-brand-500/20 object-cover w-full h-full card-hover"
          />
          <div
            class="absolute -left-8 top-1/4 glass rounded-2xl p-4 animate-float"
            style="animation-delay: 0.5s"
          >
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                <svg
                  class="w-6 h-6 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <div class="text-sm font-bold">Order Placed</div>
                <div class="text-xs text-slate-400">Just now</div>
              </div>
            </div>
          </div>
          <div
            class="absolute -right-4 bottom-1/4 glass rounded-2xl p-4 animate-float"
            style="animation-delay: 1.5s"
          >
            <div class="flex items-center gap-3">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80"
                class="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <div class="text-sm font-bold">Alex M.</div>
                <div class="text-xs text-slate-400">5 stars</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
      <svg class="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M19 14l-7 7m0 0l-7-7m7 7V3"
        />
      </svg>
    </div>
  </section>

  <!-- MARQUEE BRANDS -->
  <div class="py-8 border-y border-white/5 overflow-hidden">
    <div class="flex whitespace-nowrap marquee">
      <div
        v-for="brand in [...brands, ...brands]"
        :key="brand"
        class="flex items-center gap-3 mx-8 text-2xl font-bold text-slate-600 hover:text-slate-400 transition-colors cursor-default"
      >
        <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
        {{ brand }}
      </div>
    </div>
  </div>

  <!-- CATEGORIES -->
  <section id="categories" class="py-24 relative">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-16">
        <span class="text-brand-400 font-semibold text-sm uppercase tracking-wider"
          >Shop by Category</span
        >
        <h2 class="text-4xl font-black mt-3">Explore Our Collections</h2>
        <p class="text-slate-400 mt-4 max-w-2xl mx-auto">
          Curated categories for every lifestyle. From cutting-edge tech to timeless fashion, find
          exactly what you need.
        </p>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div
          v-for="cat in categories"
          :key="cat.name"
          @click="(filterCategory(cat.name), scrollTo('products'))"
          class="group cursor-pointer relative overflow-hidden rounded-2xl aspect-[3/4] card-hover"
        >
          <img
            :src="cat.image"
            class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div
            class="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/40 to-transparent"
          ></div>
          <div class="absolute bottom-0 left-0 right-0 p-5">
            <div
              class="w-10 h-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center mb-3 group-hover:bg-brand-500 transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  :d="cat.icon"
                />
              </svg>
            </div>
            <h3 class="font-bold text-lg">{{ cat.name }}</h3>
            <p class="text-sm text-slate-400">{{ cat.count }} items</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- FLASH SALE -->
  <section class="py-16 relative overflow-hidden">
    <div class="absolute inset-0 bg-gradient-to-r from-accent-900/50 to-brand-900/50"></div>
    <div
      class="absolute inset-0"
      style="
        background-image: radial-gradient(
          circle at 2px 2px,
          rgba(255, 255, 255, 0.05) 1px,
          transparent 0
        );
        background-size: 40px 40px;
      "
    ></div>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
      <div class="flex flex-col lg:flex-row items-center justify-between gap-8">
        <div class="text-center lg:text-left">
          <div
            class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-sm font-bold mb-4"
          >
            <span class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            FLASH SALE
          </div>
          <h2 class="text-4xl lg:text-5xl font-black">Up to 70% Off</h2>
          <p class="text-slate-400 mt-2 text-lg">Limited time deals on top brands. Ends in:</p>
        </div>
        <div class="flex gap-4">
          <div v-for="(unit, i) in countdown" :key="i" class="text-center">
            <div
              class="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl font-black gradient-text"
            >
              {{ unit.value }}
            </div>
            <div class="text-xs text-slate-400 mt-2 uppercase tracking-wider">{{ unit.label }}</div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- PRODUCTS -->
  <section id="products" class="py-24">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
        <div>
          <span class="text-brand-400 font-semibold text-sm uppercase tracking-wider"
            >Our Products</span
          >
          <h2 class="text-4xl font-black mt-3">Trending Now</h2>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="filter in productFilters"
            :key="filter"
            @click="activeFilter = filter"
            class="px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
            :class="
              activeFilter === filter
                ? 'bg-gradient-to-r from-brand-600 to-accent-600 text-white'
                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
            "
          >
            {{ filter }}
          </button>
        </div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          v-for="product in filteredProducts"
          :key="product.id"
          class="group relative bg-dark-800 rounded-2xl overflow-hidden border border-white/5 card-hover"
        >
          <div class="relative aspect-square overflow-hidden">
            <img
              :src="product.image"
              class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div
              class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors"
            ></div>
            <div class="absolute top-3 left-3 flex flex-col gap-2">
              <span
                v-if="product.sale"
                class="px-3 py-1 rounded-lg bg-red-500 text-white text-xs font-bold"
                >-{{ product.sale }}%</span
              >
              <span
                v-if="product.new"
                class="px-3 py-1 rounded-lg bg-brand-500 text-white text-xs font-bold"
                >NEW</span
              >
            </div>
            <div
              class="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0"
            >
              <button
                @click="toggleWishlist(product)"
                class="w-10 h-10 rounded-xl bg-white/90 backdrop-blur flex items-center justify-center hover:bg-white transition-colors"
              >
                <svg
                  class="w-5 h-5"
                  :class="isWishlisted(product) ? 'text-red-500 fill-red-500' : 'text-slate-700'"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </button>
              <button
                @click="quickView = product"
                class="w-10 h-10 rounded-xl bg-white/90 backdrop-blur flex items-center justify-center hover:bg-white transition-colors"
              >
                <svg
                  class="w-5 h-5 text-slate-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              </button>
            </div>
            <div
              class="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform"
            >
              <button
                @click="addToCart(product)"
                class="w-full py-3 rounded-xl bg-white text-dark-900 font-bold text-sm hover:bg-brand-50 transition-colors flex items-center justify-center gap-2"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
                Add to Cart
              </button>
            </div>
          </div>
          <div class="p-5">
            <div class="text-xs text-brand-400 font-semibold uppercase tracking-wider mb-1">
              {{ product.category }}
            </div>
            <h3 class="font-bold text-lg mb-2 line-clamp-1">{{ product.name }}</h3>
            <div class="flex items-center gap-2 mb-3">
              <div class="flex gap-0.5">
                <svg
                  v-for="n in 5"
                  :key="n"
                  class="w-4 h-4"
                  :class="
                    n <= product.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'
                  "
                  viewBox="0 0 20 20"
                >
                  <path
                    d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                  />
                </svg>
              </div>
              <span class="text-xs text-slate-400">({{ product.reviews }})</span>
            </div>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-2xl font-black">${{ product.price }}</span>
                <span v-if="product.oldPrice" class="text-sm text-slate-500 line-through"
                  >${{ product.oldPrice }}</span
                >
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="text-center mt-12">
        <button
          class="px-8 py-4 rounded-2xl border border-white/20 font-bold hover:bg-white/5 transition-all inline-flex items-center gap-2"
        >
          Load More Products
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>
    </div>
  </section>

  <!-- FEATURED DEAL -->
  <section class="py-24 relative overflow-hidden">
    <div class="absolute inset-0 bg-gradient-to-br from-brand-900/30 to-accent-900/30"></div>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
      <div class="grid lg:grid-cols-2 gap-12 items-center">
        <div class="relative">
          <div
            class="absolute inset-0 bg-gradient-to-r from-brand-500/20 to-accent-500/20 rounded-3xl blur-3xl"
          ></div>
          <img
            src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80"
            alt="Featured"
            class="relative rounded-3xl shadow-2xl w-full object-cover aspect-square"
          />
          <div
            class="absolute -bottom-6 -right-6 w-32 h-32 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center glow-pulse"
          >
            <div class="text-center">
              <div class="text-2xl font-black">50%</div>
              <div class="text-xs font-bold">OFF</div>
            </div>
          </div>
        </div>
        <div class="space-y-6">
          <span
            class="inline-block px-4 py-2 rounded-full bg-accent-500/10 text-accent-400 text-sm font-bold"
            >Deal of the Day</span
          >
          <h2 class="text-4xl lg:text-5xl font-black">Premium Wireless Headphones Pro</h2>
          <p class="text-slate-400 text-lg leading-relaxed">
            Experience studio-quality sound with active noise cancellation, 40-hour battery life,
            and premium comfort. The ultimate audio companion for work and play.
          </p>
          <div class="flex items-center gap-4">
            <span class="text-5xl font-black gradient-text">$149</span>
            <span class="text-2xl text-slate-500 line-through">$299</span>
            <span class="px-3 py-1 rounded-lg bg-green-500/20 text-green-400 text-sm font-bold"
              >Save $150</span
            >
          </div>
          <div class="flex flex-wrap gap-3">
            <div
              v-for="feat in ['ANC', '40h Battery', 'Bluetooth 5.3', 'Hi-Res Audio']"
              :key="feat"
              class="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-medium"
            >
              {{ feat }}
            </div>
          </div>
          <div class="flex gap-4 pt-4">
            <button
              @click="
                addToCart({
                  id: 999,
                  name: 'Premium Wireless Headphones Pro',
                  price: 149,
                  image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80',
                  category: 'Electronics',
                })
              "
              class="flex-1 py-4 rounded-2xl bg-gradient-to-r from-brand-600 to-accent-600 font-bold text-lg hover:shadow-2xl hover:shadow-brand-500/30 transition-all"
            >
              Add to Cart
            </button>
            <button
              class="w-16 h-16 rounded-2xl border border-white/20 flex items-center justify-center hover:bg-white/5 transition-colors"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- WHY CHOOSE US -->
  <section id="features" class="py-24">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-16">
        <span class="text-brand-400 font-semibold text-sm uppercase tracking-wider">Why NEXUS</span>
        <h2 class="text-4xl font-black mt-3">The NEXUS Advantage</h2>
      </div>
      <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          v-for="(feature, i) in features"
          :key="i"
          class="group p-8 rounded-3xl bg-dark-800 border border-white/5 hover:border-brand-500/30 transition-all card-hover text-center"
        >
          <div
            class="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500/20 to-accent-500/20 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform"
          >
            <svg
              class="w-8 h-8 text-brand-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                :d="feature.icon"
              />
            </svg>
          </div>
          <h3 class="text-xl font-bold mb-3">{{ feature.title }}</h3>
          <p class="text-slate-400 text-sm leading-relaxed">{{ feature.desc }}</p>
        </div>
      </div>
    </div>
  </section>

  <!-- TESTIMONIALS -->
  <section id="testimonials" class="py-24 relative overflow-hidden">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-16">
        <span class="text-brand-400 font-semibold text-sm uppercase tracking-wider"
          >Testimonials</span
        >
        <h2 class="text-4xl font-black mt-3">What Our Customers Say</h2>
      </div>
      <div class="grid md:grid-cols-3 gap-6">
        <div
          v-for="(review, i) in testimonials"
          :key="i"
          class="p-8 rounded-3xl bg-dark-800 border border-white/5 relative"
        >
          <svg
            class="w-10 h-10 text-brand-500/20 absolute top-6 right-6"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"
            />
          </svg>
          <div class="flex gap-1 mb-4">
            <svg
              v-for="n in 5"
              :key="n"
              class="w-4 h-4 text-yellow-400 fill-yellow-400"
              viewBox="0 0 20 20"
            >
              <path
                d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
              />
            </svg>
          </div>
          <p class="text-slate-300 mb-6 leading-relaxed">"{{ review.text }}"</p>
          <div class="flex items-center gap-4">
            <img :src="review.avatar" class="w-12 h-12 rounded-full object-cover" />
            <div>
              <div class="font-bold">{{ review.name }}</div>
              <div class="text-sm text-slate-400">{{ review.role }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- NEWSLETTER -->
  <section class="py-24">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="relative rounded-3xl overflow-hidden p-12 text-center">
        <div class="absolute inset-0 bg-gradient-to-br from-brand-600 to-accent-600"></div>
        <div
          class="absolute inset-0"
          style="
            background-image: radial-gradient(
              circle at 2px 2px,
              rgba(255, 255, 255, 0.1) 1px,
              transparent 0
            );
            background-size: 30px 30px;
          "
        ></div>
        <div class="relative z-10">
          <div
            class="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-6"
          >
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 class="text-3xl font-black mb-4">Join 100,000+ Shoppers</h2>
          <p class="text-white/80 mb-8 max-w-lg mx-auto">
            Get exclusive deals, early access to sales, and personalized recommendations delivered
            to your inbox.
          </p>
          <div class="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              v-model="email"
              type="email"
              placeholder="Enter your email"
              class="flex-1 px-5 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-white transition-colors"
            />
            <button
              @click="subscribe"
              class="px-8 py-4 rounded-xl bg-white text-brand-600 font-bold hover:bg-brand-50 transition-colors"
            >
              Subscribe
            </button>
          </div>
          <p v-if="subscribed" class="mt-4 text-green-300 font-medium">Thanks for subscribing!</p>
        </div>
      </div>
    </div>
  </section>

  <!-- FOOTER -->
  <footer class="border-t border-white/5 pt-20 pb-10">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 mb-16">
        <div class="col-span-2 lg:col-span-2">
          <div class="flex items-center gap-3 mb-6">
            <div
              class="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center"
            >
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <span class="text-2xl font-black">NEXUS</span>
          </div>
          <p class="text-slate-400 mb-6 max-w-sm">
            Your one-stop destination for premium products. Quality guaranteed, delivered to your
            doorstep.
          </p>
          <div class="flex gap-3">
            <a
              v-for="social in ['twitter', 'facebook', 'instagram', 'linkedin']"
              :key="social"
              href="#"
              class="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-brand-500 hover:text-white transition-all"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 0"
                />
              </svg>
            </a>
          </div>
        </div>
        <div>
          <h4 class="font-bold mb-4">Shop</h4>
          <ul class="space-y-3 text-sm text-slate-400">
            <li><a href="#" class="hover:text-white transition-colors">New Arrivals</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Best Sellers</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Sale</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Gift Cards</a></li>
          </ul>
        </div>
        <div>
          <h4 class="font-bold mb-4">Support</h4>
          <ul class="space-y-3 text-sm text-slate-400">
            <li><a href="#" class="hover:text-white transition-colors">Help Center</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Shipping Info</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Returns</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Contact Us</a></li>
          </ul>
        </div>
        <div>
          <h4 class="font-bold mb-4">Company</h4>
          <ul class="space-y-3 text-sm text-slate-400">
            <li><a href="#" class="hover:text-white transition-colors">About Us</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Careers</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Press</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Blog</a></li>
          </ul>
        </div>
      </div>
      <div
        class="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4"
      >
        <p class="text-sm text-slate-500">2026 NEXUS. All rights reserved.</p>
        <div class="flex gap-6 text-sm text-slate-500">
          <a href="#" class="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" class="hover:text-white transition-colors">Terms of Service</a>
          <a href="#" class="hover:text-white transition-colors">Cookies</a>
        </div>
      </div>
    </div>
  </footer>

  <!-- CART SIDEBAR -->
  <transition name="slide">
    <div v-if="cartOpen" class="fixed inset-0 z-50">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="cartOpen = false"></div>
      <div
        class="absolute right-0 top-0 bottom-0 w-full max-w-md bg-dark-800 border-l border-white/5 flex flex-col"
      >
        <div class="p-6 border-b border-white/5 flex items-center justify-between">
          <h3 class="text-xl font-bold">Your Cart ({{ cartItemCount }})</h3>
          <button @click="cartOpen = false" class="p-2 rounded-xl hover:bg-white/10">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div class="flex-1 overflow-y-auto p-6 space-y-4">
          <div v-if="!cart.length" class="text-center py-20">
            <div
              class="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4"
            >
              <svg
                class="w-10 h-10 text-slate-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>
            <p class="text-slate-400">Your cart is empty</p>
            <button
              @click="((cartOpen = false), scrollTo('products'))"
              class="mt-4 text-brand-400 font-semibold hover:text-brand-300"
            >
              Start Shopping
            </button>
          </div>
          <div v-for="item in cart" :key="item.id" class="flex gap-4 p-4 rounded-2xl bg-white/5">
            <img :src="item.image" class="w-20 h-20 rounded-xl object-cover" />
            <div class="flex-1">
              <h4 class="font-bold text-sm">{{ item.name }}</h4>
              <p class="text-slate-400 text-xs">{{ item.category }}</p>
              <div class="flex items-center justify-between mt-2">
                <div class="flex items-center gap-2">
                  <button
                    @click="updateQty(item, -1)"
                    class="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-sm hover:bg-white/20"
                  >
                    -
                  </button>
                  <span class="text-sm font-bold w-6 text-center">{{ item.qty }}</span>
                  <button
                    @click="updateQty(item, 1)"
                    class="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-sm hover:bg-white/20"
                  >
                    +
                  </button>
                </div>
                <span class="font-bold">${{ (item.price * item.qty).toFixed(2) }}</span>
              </div>
            </div>
            <button
              @click="removeFromCart(item)"
              class="self-start p-1 text-slate-500 hover:text-red-400"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>
        <div v-if="cart.length" class="p-6 border-t border-white/5 space-y-4">
          <div class="flex justify-between text-sm">
            <span class="text-slate-400">Subtotal</span
            ><span class="font-bold">${{ cartTotal.toFixed(2) }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-slate-400">Shipping</span
            ><span class="font-bold text-green-400">Free</span>
          </div>
          <div class="flex justify-between text-lg font-black pt-2 border-t border-white/5">
            <span>Total</span><span class="gradient-text">${{ cartTotal.toFixed(2) }}</span>
          </div>
          <button
            class="w-full py-4 rounded-2xl bg-gradient-to-r from-brand-600 to-accent-600 font-bold text-lg hover:shadow-lg transition-all"
          >
            Checkout
          </button>
        </div>
      </div>
    </div>
  </transition>

  <!-- WISHLIST SIDEBAR -->
  <transition name="slide">
    <div v-if="wishlistOpen" class="fixed inset-0 z-50">
      <div
        class="absolute inset-0 bg-black/60 backdrop-blur-sm"
        @click="wishlistOpen = false"
      ></div>
      <div
        class="absolute right-0 top-0 bottom-0 w-full max-w-md bg-dark-800 border-l border-white/5 flex flex-col"
      >
        <div class="p-6 border-b border-white/5 flex items-center justify-between">
          <h3 class="text-xl font-bold">Wishlist ({{ wishlist.length }})</h3>
          <button @click="wishlistOpen = false" class="p-2 rounded-xl hover:bg-white/10">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div class="flex-1 overflow-y-auto p-6 space-y-4">
          <div v-if="!wishlist.length" class="text-center py-20">
            <div
              class="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4"
            >
              <svg
                class="w-10 h-10 text-slate-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </div>
            <p class="text-slate-400">Your wishlist is empty</p>
          </div>
          <div
            v-for="item in wishlist"
            :key="item.id"
            class="flex gap-4 p-4 rounded-2xl bg-white/5 group"
          >
            <img :src="item.image" class="w-20 h-20 rounded-xl object-cover" />
            <div class="flex-1">
              <h4 class="font-bold text-sm">{{ item.name }}</h4>
              <p class="text-slate-400 text-xs">{{ item.category }}</p>
              <div class="flex items-center justify-between mt-2">
                <span class="font-bold text-brand-400">${{ item.price }}</span>
                <button
                  @click="addToCart(item)"
                  class="px-3 py-1.5 rounded-lg bg-brand-500/20 text-brand-400 text-xs font-bold hover:bg-brand-500 hover:text-white transition-all"
                >
                  Add to Cart
                </button>
              </div>
            </div>
            <button @click="toggleWishlist(item)" class="self-start p-1 text-red-400">
              <svg class="w-4 h-4 fill-red-400" viewBox="0 0 24 24">
                <path
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </transition>

  <!-- QUICK VIEW MODAL -->
  <transition name="fade">
    <div v-if="quickView" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" @click="quickView = null"></div>
      <div
        class="relative bg-dark-800 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-white/10"
      >
        <button
          @click="quickView = null"
          class="absolute top-4 right-4 z-10 w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        <div class="grid md:grid-cols-2">
          <img :src="quickView.image" class="w-full h-64 md:h-full object-cover" />
          <div class="p-8">
            <div class="text-xs text-brand-400 font-bold uppercase tracking-wider mb-2">
              {{ quickView.category }}
            </div>
            <h3 class="text-2xl font-black mb-4">{{ quickView.name }}</h3>
            <div class="flex items-center gap-2 mb-4">
              <div class="flex gap-0.5">
                <svg
                  v-for="n in 5"
                  :key="n"
                  class="w-4 h-4"
                  :class="
                    n <= quickView.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'
                  "
                  viewBox="0 0 20 20"
                >
                  <path
                    d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                  />
                </svg>
              </div>
              <span class="text-sm text-slate-400">({{ quickView.reviews }} reviews)</span>
            </div>
            <div class="flex items-center gap-3 mb-6">
              <span class="text-3xl font-black">${{ quickView.price }}</span>
              <span v-if="quickView.oldPrice" class="text-lg text-slate-500 line-through"
                >${{ quickView.oldPrice }}</span
              >
              <span
                v-if="quickView.sale"
                class="px-2 py-1 rounded-lg bg-red-500/20 text-red-400 text-sm font-bold"
                >-{{ quickView.sale }}%</span
              >
            </div>
            <p class="text-slate-400 mb-6 leading-relaxed">
              Premium quality product with exceptional craftsmanship. Designed for those who demand
              the best. Features durable materials and modern aesthetics.
            </p>
            <div class="flex gap-3">
              <button
                @click="(addToCart(quickView), (quickView = null))"
                class="flex-1 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-accent-600 font-bold hover:shadow-lg transition-all"
              >
                Add to Cart
              </button>
              <button
                @click="toggleWishlist(quickView)"
                class="w-14 h-12 rounded-xl border border-white/20 flex items-center justify-center hover:bg-white/5 transition-colors"
              >
                <svg
                  class="w-5 h-5"
                  :class="isWishlisted(quickView) ? 'text-red-500 fill-red-500' : 'text-slate-400'"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>

  <!-- TOAST -->
  <transition name="toast">
    <div
      v-if="toast"
      class="fixed bottom-8 right-8 z-50 px-6 py-4 rounded-2xl bg-dark-800 border border-white/10 shadow-2xl flex items-center gap-3"
    >
      <div class="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
        <svg class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <span class="font-medium">{{ toast }}</span>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
const scrolled = ref(false)
const mobileMenu = ref(false)
const searchOpen = ref(false)
const searchQuery = ref('')
const cartOpen = ref(false)
const wishlistOpen = ref(false)
const quickView = ref(null)
const toast = ref('')
const activeFilter = ref('All')
const email = ref('')
const subscribed = ref(false)
const cart = ref([])
const wishlist = ref([])

const navLinks = [
  { id: 'hero', label: 'Home' },
  { id: 'categories', label: 'Categories' },
  { id: 'products', label: 'Products' },
  { id: 'features', label: 'Features' },
  { id: 'testimonials', label: 'Reviews' },
]

const heroStats = [
  { value: '50K+', label: 'Products' },
  { value: '200+', label: 'Cities' },
  { value: '1M+', label: 'Customers' },
]

const brands = [
  'Nike',
  'Adidas',
  'Apple',
  'Samsung',
  'Sony',
  'Gucci',
  'Zara',
  'H&M',
  'Levis',
  'Puma',
]

const categories = [
  {
    name: 'Electronics',
    count: '2,400+',
    image: 'https://images.unsplash.com/photo-1498049860654-af1a5c5668ba?w=400&q=80',
    icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  },
  {
    name: 'Fashion',
    count: '8,500+',
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&q=80',
    icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z',
  },
  {
    name: 'Home',
    count: '3,200+',
    image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=400&q=80',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  },
  {
    name: 'Sports',
    count: '1,800+',
    image: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=400&q=80',
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
  },
  {
    name: 'Beauty',
    count: '2,100+',
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&q=80',
    icon: 'M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    name: 'Books',
    count: '5,000+',
    image: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&q=80',
    icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
  },
]

const countdown = ref([
  { value: '02', label: 'Hours' },
  { value: '45', label: 'Minutes' },
  { value: '30', label: 'Seconds' },
])

const productFilters = ['All', 'Electronics', 'Fashion', 'Home', 'Sports']

const products = ref([
  {
    id: 1,
    name: 'Wireless Noise-Canceling Headphones',
    category: 'Electronics',
    price: 199,
    oldPrice: 299,
    sale: 33,
    rating: 5,
    reviews: 234,
    new: true,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80',
  },
  {
    id: 2,
    name: 'Minimalist Leather Watch',
    category: 'Fashion',
    price: 149,
    oldPrice: 220,
    sale: 32,
    rating: 4,
    reviews: 189,
    new: false,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80',
  },
  {
    id: 3,
    name: 'Smart Home Speaker Hub',
    category: 'Electronics',
    price: 89,
    oldPrice: 129,
    sale: 31,
    rating: 4,
    reviews: 567,
    new: true,
    image: 'https://images.unsplash.com/photo-1589492477829-5e65395b66cc?w=400&q=80',
  },
  {
    id: 4,
    name: 'Organic Cotton T-Shirt Pack',
    category: 'Fashion',
    price: 45,
    oldPrice: 65,
    sale: 31,
    rating: 5,
    reviews: 892,
    new: false,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80',
  },
  {
    id: 5,
    name: 'Ergonomic Office Chair',
    category: 'Home',
    price: 349,
    oldPrice: 499,
    sale: 30,
    rating: 5,
    reviews: 156,
    new: true,
    image: 'https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?w=400&q=80',
  },
  {
    id: 6,
    name: 'Running Shoes Pro',
    category: 'Sports',
    price: 129,
    oldPrice: 180,
    sale: 28,
    rating: 4,
    reviews: 445,
    new: false,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80',
  },
  {
    id: 7,
    name: '4K Ultra HD Monitor',
    category: 'Electronics',
    price: 399,
    oldPrice: 549,
    sale: 27,
    rating: 5,
    reviews: 321,
    new: false,
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&q=80',
  },
  {
    id: 8,
    name: 'Designer Sunglasses',
    category: 'Fashion',
    price: 189,
    oldPrice: 250,
    sale: 24,
    rating: 4,
    reviews: 278,
    new: true,
    image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&q=80',
  },
  {
    id: 9,
    name: 'Smart Fitness Tracker',
    category: 'Sports',
    price: 79,
    oldPrice: 99,
    sale: 20,
    rating: 4,
    reviews: 1023,
    new: false,
    image: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=400&q=80',
  },
  {
    id: 10,
    name: 'Ceramic Coffee Set',
    category: 'Home',
    price: 59,
    oldPrice: 85,
    sale: 31,
    rating: 5,
    reviews: 334,
    new: false,
    image: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=400&q=80',
  },
  {
    id: 11,
    name: 'Mechanical Keyboard RGB',
    category: 'Electronics',
    price: 149,
    oldPrice: 199,
    sale: 25,
    rating: 5,
    reviews: 678,
    new: true,
    image: 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=400&q=80',
  },
  {
    id: 12,
    name: 'Yoga Mat Premium',
    category: 'Sports',
    price: 49,
    oldPrice: 69,
    sale: 29,
    rating: 4,
    reviews: 445,
    new: false,
    image: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400&q=80',
  },
])

const features = [
  {
    title: 'Free Shipping',
    desc: 'Free delivery on all orders over $50. Same-day delivery in select cities.',
    icon: 'M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0',
  },
  {
    title: 'Secure Payment',
    desc: '256-bit SSL encryption. All major cards and digital wallets accepted.',
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  },
  {
    title: '24/7 Support',
    desc: 'Round-the-clock customer service via chat, email, and phone.',
    icon: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z',
  },
  {
    title: 'Easy Returns',
    desc: '30-day hassle-free returns. Full refund guaranteed on all products.',
    icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  },
]

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Verified Buyer',
    text: 'Absolutely love the quality of products from NEXUS. Fast shipping and the packaging was beautiful. Will definitely be ordering again!',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80',
  },
  {
    name: 'Michael Chen',
    role: 'Tech Enthusiast',
    text: 'The electronics selection is unmatched. Got my new headphones at an amazing price and they arrived the next day. Customer service was top-notch.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80',
  },
  {
    name: 'Emily Davis',
    role: 'Fashion Blogger',
    role: 'Fashion Blogger',
    text: 'NEXUS has become my go-to for fashion finds. The curated collections make shopping so easy. Quality is consistently excellent across all categories.',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80',
  },
]

const filteredProducts = computed(() => {
  let result = products.value
  if (activeFilter.value !== 'All') {
    result = result.filter((p) => p.category === activeFilter.value)
  }
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(
      (p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q),
    )
  }
  return result
})

const cartItemCount = computed(() => cart.value.reduce((sum, item) => sum + item.qty, 0))
const cartTotal = computed(() => cart.value.reduce((sum, item) => sum + item.price * item.qty, 0))

const scrollTo = (id) => {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth' })
}

const showToast = (msg) => {
  toast.value = msg
  setTimeout(() => (toast.value = ''), 2500)
}

const addToCart = (product) => {
  const existing = cart.value.find((item) => item.id === product.id)
  if (existing) {
    existing.qty++
  } else {
    cart.value.push({ ...product, qty: 1 })
  }
  showToast('Added to cart!')
}

const updateQty = (item, delta) => {
  item.qty += delta
  if (item.qty <= 0) {
    cart.value = cart.value.filter((i) => i.id !== item.id)
  }
}

const removeFromCart = (item) => {
  cart.value = cart.value.filter((i) => i.id !== item.id)
}

const toggleWishlist = (product) => {
  const idx = wishlist.value.findIndex((i) => i.id === product.id)
  if (idx >= 0) {
    wishlist.value.splice(idx, 1)
    showToast('Removed from wishlist')
  } else {
    wishlist.value.push(product)
    showToast('Added to wishlist!')
  }
}

const isWishlisted = (product) => {
  return wishlist.value.some((i) => i.id === product.id)
}

const filterCategory = (cat) => {
  activeFilter.value = cat
}

const subscribe = () => {
  if (email.value) {
    subscribed.value = true
    email.value = ''
    setTimeout(() => (subscribed.value = false), 3000)
  }
}

onMounted(() => {
  const onScroll = () => {
    scrolled.value = window.scrollY > 50
  }
  window.addEventListener('scroll', onScroll)
  onUnmounted(() => window.removeEventListener('scroll', onScroll))
})
</script>

<style scoped>
[v-cloak] {
  display: none;
}
@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-12px);
  }
}
.animate-float {
  animation: float 4s ease-in-out infinite;
}
@keyframes pulse-glow {
  0%,
  100% {
    box-shadow: 0 0 20px rgba(14, 165, 233, 0.3);
  }
  50% {
    box-shadow: 0 0 40px rgba(14, 165, 233, 0.6);
  }
}
.glow-pulse {
  animation: pulse-glow 2s ease-in-out infinite;
}
.glass {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.glass-dark {
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.05);
}
.gradient-text {
  background: linear-gradient(135deg, #0ea5e9, #d946ef);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.card-hover {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.card-hover:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}
.marquee {
  animation: marquee 30s linear infinite;
}
@keyframes marquee {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}
.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.4;
}
.slide-enter-active,
.slide-leave-active {
  transition: all 0.4s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
