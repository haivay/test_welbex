<script setup>
import { ref, computed, onMounted, watch, reactive } from 'vue'
import axios from 'axios'

const props = defineProps({
  tableName: {
    type: String
  },
  columnsCount: {
    type: Number,
    default: 0
  },
  headers: {
    type: Array
  },
  pageRows: {
    type: Number,
    default: 10,
  }
})

const engTableFields = ref([])
const tableFields = ref([])
const tableRows = ref([])
const isLoading = ref(false) // лоадер заметен на fast 3G

onMounted(() => {
  getData()
})

function getData(sortField, sortOrder) {
  isLoading.value = true

  const config = {
    tableName: props.tableName,
    pageRows: props.pageRows,
    currentPage: currentPage.value,
    filterStatement: filterStatement.value,
    sortField: sortField,
    sortOrder: sortOrder
  }

  axios
    .post('/api/getTableData', config)
    .then((res) => {
      tableRows.value = res.data.rows
      engTableFields.value = res.data.tableFields
      totalPages.value = res.data.totalPages

      if (props.headers.length === props.columnsCount) {
        tableFields.value = props.headers
      } else {
        tableFields.value = engTableFields.slice(1)
      }

      isLoading.value = false
    })
}

// сортировка
const sortField = ref('')
const sortFieldIndex = ref(-1)
const sortOrder = ref('')

function changeSortField(field, fieldIndex) {
  sortFieldIndex.value = fieldIndex
  sortOrder.value = sortField.value === field ? switchSortOrder(sortOrder.value) : 'ASC'
  sortField.value = field
  applySort()
}

function switchSortOrder(currentSortOrder) {
  if (currentSortOrder === 'ASC') return 'DESC'
  return 'ASC'
}

function applySort() {
  let engSortField = engTableFields.value[sortFieldIndex.value + 1]
  getData(engSortField, sortOrder.value)
}

// фильтрация
const filter = reactive({
  field: '',
  condition: '',
  value: ''
})
const filterStatement = ref('')

const filterConditions = [
  { text: 'Равно', value: '=' },
  { text: 'Содержит', value: 'LIKE' },
  { text: 'Больше', value: '>' },
  { text: 'Меньше', value: '<' }
]

function checkFiltersOnEmpty() {
  for (let key in filter) {      
    if (filter[key] === '') {
      filterStatement.value = ''
      return false
    }
    if (filter.field === 'date' && filter.value.length < 9) {
      return false
    }
  }
  return true
}

const checkFiltersAnyNotEmpty = computed(() => {
  for (let value of filter.value) {
    if (value != '') {
      return true
    }
  }
  return false
})

const timer = ref(null)

watch(
  () => filter,
  () => {
    if (timer.value) {
      clearTimeout(timer.value)
      timer.value = null
    }

    timer.value = setTimeout(() => {
      if (checkFiltersOnEmpty()) {
        if (filter.condition === 'LIKE') {
          filterStatement.value = `${filter.field} ${filter.condition} '%${filter.value}%'`
        } else {
          filterStatement.value = `${filter.field} ${filter.condition} '${filter.value}'`
        }
        if (sortFieldIndex.value > -1) {
          getData(engTableFields.value[sortFieldIndex.value + 1], sortOrder.value)
        } else {
          getData()
        }
      }
    }, 800)
  },
  { deep: true }
)

function resetFilters() {
  filterStatement.value = ''
  filter.field = ''
  filter.condition = ''
  filter.value = ''
  getData()
}

// пагинация
const totalPages = ref(1)
const currentPage = ref(1)

watch(currentPage, () => {
  let currentSortOrder = sortOrder.value ? sortOrder.value : ''
  getData(engTableFields.value[sortFieldIndex.value + 1], currentSortOrder)
})

const navPages = computed(() => {
  const pages = [];
  if (currentPage.value - 1 <= 1) {
    pages.push((currentPage.value - 1 > 1) ? currentPage.value - 1 : 1);
    if ((currentPage.value < totalPages.value) || (2 < totalPages.value)) pages.push((currentPage.value - 1 > 1) ? currentPage.value : 2);
    if ((currentPage.value + 1 < totalPages.value) || (3 < totalPages.value)) pages.push((currentPage.value - 1 > 1) ? currentPage.value + 1 : 3);
    return pages;
  }
  pages.push((currentPage.value + 1 < totalPages.value) ? currentPage.value - 1 : totalPages.value - 2);
  pages.push((currentPage.value + 1 < totalPages.value) ? currentPage.value : totalPages.value - 1);
  pages.push((currentPage.value + 1 < totalPages.value) ? currentPage.value + 1 : totalPages.value);
  return pages;
})

function goToPage(n) {
  currentPage.value = n
}
</script>

<template>
  <div class="full-table relative transition-opacity ease-in-out" :class="isLoading ? 'opacity-50' : ''">
    <div class="bg-slate-800 rounded-lg w-full pt-1.5">
      <table class="table table-fixed w-full">
        <thead>
          <tr>
            <th
              v-for="(field, fieldIndex) in tableFields"
              :key="fieldIndex"
              class="group select-none bg-slate-800 text-left text-xs font-medium text py-3 px-2 md:text-base md:py-3 md:px-10 text-slate-50 "
              :class="field != 'Дата' && field != 'date' && !isLoading && tableRows.length ? 'hover:text-slate-400 hover:cursor-pointer' : ''"
              @click="field != 'Дата' && field != 'date' && !isLoading && tableRows.length ? changeSortField(field, fieldIndex) : ''"
            >
              {{ field }}
              <font-awesome-icon 
                :icon="sortField === field ? sortOrder === 'ASC' ? 'fa-solid fa-sort-up' : 'fa-solid fa-sort-down' : 'fa-solid fa-sort'"
                size="sm" 
                v-if="field != 'Дата' && field != 'date' && !isLoading && tableRows.length"
                class="pl-1 group-hover:visible"
                :class="sortField === field ? 'visible' : 'invisible'"
              />
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, rowIndex) in tableRows"
            :key="rowIndex"
            class="bg-slate-600 border-b border-b-gray-500"
          >
            <td
              v-for="(value, key) in row"
              :key="value.id"
              :class="key === 'id' ? 'hidden' : ''"
              class="py-2 px-2 text-xs font-light text-slate-300 md:px-10 md:py-3 md:text-base"
            >
              {{ value }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="!isLoading && !tableRows.length" class="bg-slate-600 h-auto flex flex-col justify-center items-center rounded-b-md my-1 py-28 md:py-36 text-slate-200">
      <p class="font-bold text-lg">Ничего не найдено...</p>
      <a @click="resetFilters()" class="mt-10 border border-slate-200 px-3 py-2 md:px-4 md:py-2 bg-inherit rounded-md cursor-pointer text-sm md:text-base font-light hover:text-slate-400 hover:border-slate-400 transition-all ease-in-out">Сбросить фильтры</a>
    </div>
    <nav v-if="!isLoading && tableRows.length" class="bg-slate-600 mt-1 flex flex-row justify-between items-center text-slate-200 font-light shadow-gray-800 rounded-b-lg py-2 px-6 select-none">
      <div class="flex flex-row items-center justify-between w-5/12">
        <select 
          v-model="filter.field" placeholder="Выберите поле..." :disabled="isLoading" 
          class="w-3/12 bg-white border text-black border-slate-300 rounded-md text-sm shadow-sm placeholder-black
          focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-300
          disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200 disabled:shadow-none"
        >
          <option value="" disabled selected hidden>Выберите поле...</option>
          <option
            v-for="(field, index) in tableFields"
            :key="index"
            :value="engTableFields[index + 1]"
          >{{ field }}</option>
        </select>
        <select 
          v-model="filter.condition" placeholder="Выберите условие..." :disabled="isLoading" 
          class="w-3/12 bg-white border text-black border-slate-300 rounded-md text-sm shadow-sm placeholder-black
          focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-300
          disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200 disabled:shadow-none"
        >
          <option value="" disabled selected hidden>Выберите условие...</option>
          <option
            v-for="(condition, index) in filterConditions"
            :key="index"
            :value="condition.value"
          >{{ condition.text }}</option>
        </select>
        <input 
          v-model="filter.value" placeholder="Введите значение" :disabled="isLoading" type="text" 
          class="w-5/12 bg-white px-1 border text-black border-slate-300 rounded-md text-sm shadow-sm placeholder-black 
          focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-300
          disabled:bg-slate-100 disabled:text-slate-500 disabled:opacity-80 disabled:placeholder-slate-500 disabled:border-slate-200 disabled:shadow-none"
        >
        <font-awesome-icon 
          icon="fa-solid fa-filter-circle-xmark" 
          class="w-fit p-1 transition-all ease-in-out" 
          :class="checkFiltersAnyNotEmpty ? 'opacity-100 hover:text-slate-400 hover:cursor-pointer' : 'opacity-0'" 
          @click="checkFiltersAnyNotEmpty && resetFilters()"
        />
      </div>
      <div class="flex flex-row items-center select-none" :class="totalPages > 1 ? 'visible' : 'invisible'" v-if="totalPages > 1">
        <font-awesome-icon icon="fa-solid fa-angle-double-left" size="sm" 
          class="pr-3"
          :class="currentPage === 1 || isLoading ? 'text-slate-400' : 'hover:text-slate-400 hover:cursor-pointer'"
          @click="!isLoading && goToPage(1)"
        />
        <font-awesome-icon icon="fa-solid fa-angle-left" size="sm" 
          class="pr-3"
          :class="currentPage < 2 || isLoading ? 'text-slate-400' : 'hover:text-slate-400 hover:cursor-pointer'"
          @click="!isLoading && goToPage(currentPage - 1)"
        />
        <a
          v-for="n in navPages"
          class="px-2 c text-base font-medium"
          :class="currentPage === n || isLoading ? 'text-slate-400' : 'hover:text-slate-400 hover:cursor-pointer'"
          @click="!isLoading && goToPage(n)"
        >
          {{ n }}
        </a>
        <font-awesome-icon icon="fa-solid fa-angle-right" size="sm" 
          class="pl-2"
          :class="currentPage === totalPages || isLoading ? 'text-slate-400' : 'hover:text-slate-400 hover:cursor-pointer'"
          @click="!isLoading && goToPage(currentPage + 1)"
        />
        <font-awesome-icon icon="fa-solid fa-angle-double-right" size="sm" 
          class="pl-3"
          :class="currentPage === totalPages || isLoading ? 'text-slate-400' : 'hover:text-slate-400 hover:cursor-pointer'"
          @click="!isLoading && goToPage(totalPages)"
        />
      </div>
    </nav>
    <Transition name="loader">
      <div v-if="isLoading" class="loader-eclips absolute">
        <div class="ldio">
          <div></div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.loader-enter-active,
.loader-leave-active {
  transition: opacity 0.2s ease-in-out;
}

.loader-enter-from,
.loader-leave-to {
  opacity: 0;
}
@keyframes ldio {
  0% { transform: rotate(0deg) }
  50% { transform: rotate(180deg) }
  100% { transform: rotate(360deg) }
}
.ldio div {
  position: absolute;
  animation: ldio 0.8s linear infinite;
  width: 60px;
  height: 60px;
  top: 70px;
  left: 70px;
  border-radius: 50%;
  box-shadow: 0 4px 0 0 #ffffff;
  transform-origin: 30px 32px;
}
.loader-eclips {
  width: 200px;
  height: 200px;
  display: absolute;
  top: 30%;
  left: 43%;
  overflow: hidden;
  background: inherit;
}
.ldio {
  width: 100%;
  height: 100%;
  position: relative;
  transform: translateZ(0) scale(1);
  backface-visibility: hidden;
  transform-origin: 0 0;
}
.ldio div { box-sizing: content-box; }
/* generated by https://loading.io/ */
</style>